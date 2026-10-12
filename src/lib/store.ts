// 本地数据层：localStorage 持久化 + 核心业务规则（幂等签到、课时账复算、冲销等）
import { useEffect, useState } from 'react';
import type { DB, Attendance, Ledger, Session, Quadrant } from '@/types';
import { seedDB } from './seed';

const KEY = 'xxl-workbench-v1';
let cache: DB | null = null;

export function loadDB(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      migrate(cache); // P01：旧版本地数据补齐 v0.4 新增集合，不丢原有数据
      persist();
      return cache;
    }
  } catch { /* 解析失败则重置 */ }
  cache = seedDB();
  persist();
  return cache;
}

/** P01 迁移保护：为 v0.4 之前的本地数据补空集合与缺省字段（幂等，不覆盖已有数据） */
function migrate(db: DB) {
  const d = db as unknown as Record<string, unknown>;
  const arr = (k: string) => { if (!Array.isArray(d[k])) d[k] = []; };
  ['providerCaps', 'rules', 'commEvents', 'materialCandidates', 'meetingEvidence', 'migrationBatches'].forEach(arr);
  if (d.collectionConfig === undefined) d.collectionConfig = undefined;
  db.attendance?.forEach(a => { if (!a.evidence) a.evidence = '手动确认'; });
}
export function persist() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}
export function resetDB(): DB {
  cache = seedDB();
  persist();
  return cache;
}

// React hook：组件共享同一份数据，任何修改后调用 update 触发重渲染并持久化
const listeners = new Set<() => void>();
export function useDB(): [DB, (fn: (db: DB) => void) => void] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  const update = (fn: (db: DB) => void) => {
    const db = loadDB();
    fn(db);
    persist();
    listeners.forEach(l => l());
  };
  return [loadDB(), update];
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// ---- 业务规则 ----

/** 签到（幂等）：同一学员同一课次有效记录唯一；重复请求返回已有记录，不生成第二次课时扣减 */
export function checkin(db: DB, sessionId: string, studentId: string): { created: boolean; att: Attendance; deducted: boolean; reason: string } {
  const exist = db.attendance.find(a => a.sessionId === sessionId && a.studentId === studentId);
  if (exist) return { created: false, att: exist, deducted: false, reason: '已有签到记录，未重复扣课（幂等）' };
  const att: Attendance = { id: uid(), sessionId, studentId, status: '出勤', evidence: '手动确认', checkinAt: `${today()}T${nowHM()}`, corrections: [] };
  db.attendance.push(att);
  // 是否核销由产品快照规则决定；未配置（不自动核销）时不扣课
  const en = db.enrollments.find(e => e.studentId === studentId && e.status === '服务中');
  let deducted = false;
  let reason = '签到成功';
  if (en) {
    if (en.snapshot.deductRule === '签到核销') {
      db.ledger.push({ id: uid(), enrollmentId: en.id, type: '核销', qty: 1, unit: '课时', reason: '签到自动核销', sessionId, createdAt: today() });
      deducted = true;
      reason = '签到成功，按产品规则核销 1 课时';
    } else {
      reason = `签到成功；产品规则为「${en.snapshot.deductRule}」，未自动扣课`;
    }
  } else {
    reason = '签到成功；该学员无服务中报名，未扣课';
  }
  return { created: true, att, deducted, reason };
}

/** 考勤更正：保留原记录与更正原因，不改写历史；已核销的生成补回（冲销式） */
export function correctAttendance(db: DB, attId: string, to: Attendance['status'], reason: string): string {
  const att = db.attendance.find(a => a.id === attId);
  if (!att) return '记录不存在';
  if (att.status === to) return '状态未变化';
  const from = att.status;
  att.corrections.push({ at: `${today()}T${nowHM()}`, from, to, reason });
  att.status = to;
  // 若原本因签到核销过课时且新状态为请假/缺勤，则补回（不删旧账）
  if ((to === '请假' || to === '缺勤') && (from === '出勤' || from === '迟到')) {
    const ded = db.ledger.find(l => l.sessionId === att.sessionId && l.type === '核销' && !l.reversedBy &&
      db.enrollments.find(e => e.id === l.enrollmentId)?.studentId === att.studentId);
    if (ded) {
      const back: Ledger = { id: uid(), enrollmentId: ded.enrollmentId, type: '补回', qty: ded.qty, unit: ded.unit, reason: `考勤更正（${from}→${to}）：${reason}`, sessionId: att.sessionId, createdAt: today() };
      db.ledger.push(back);
      return `已更正（保留原记录）；关联核销已补回 ${ded.qty} ${ded.unit}`;
    }
  }
  return '已更正（保留原记录与更正历史）';
}

/** 服务完成：状态推进 + 生成整理/反馈后续任务（去重）；时间过去≠完成，必须显式操作 */
export function completeSession(db: DB, sessionId: string): string {
  const s = db.sessions.find(x => x.id === sessionId);
  if (!s) return '课次不存在';
  if (s.status === '已完成') return '该课次已完成，不重复操作';
  if (s.status === '已取消') return '已取消的课次不能标记完成';
  s.status = '已完成';
  s.completedAt = today();
  // 服务完成核销类产品：按规则核销
  let msg = '课次已标记完成';
  if (s.studentId) {
    const en = db.enrollments.find(e => e.studentId === s.studentId && e.status === '服务中');
    if (en?.snapshot.deductRule === '服务完成核销') {
      const already = db.ledger.find(l => l.sessionId === sessionId && l.type === '核销' && !l.reversedBy);
      if (!already) {
        db.ledger.push({ id: uid(), enrollmentId: en.id, type: '核销', qty: 1, unit: '课时', reason: '服务完成核销', sessionId, createdAt: today() });
        msg += '，按产品规则核销 1 课时';
      }
    }
    // 生成待整理记录任务（去重：同源任务不重复生成）
    const dup = db.tasks.find(t => t.source === '服务后续' && t.linkedLabel?.includes(s.title) && t.status !== '完成' && t.status !== '取消');
    if (!dup) {
      db.tasks.push({ id: uid(), title: `整理「${s.title}」服务记录并确认反馈`, status: '待处理', quadrant: null, dueDate: today(), source: '服务后续', linkedLabel: s.title, doneLog: [], createdAt: today() });
      msg += '；已生成待整理记录任务';
    } else {
      msg += '；后续任务已存在，未重复生成';
    }
  }
  return msg;
}

/** 课时余额：由账目复算，不存余额字段 */
export function balanceOf(db: DB, enrollmentId: string): number {
  return db.ledger.filter(l => l.enrollmentId === enrollmentId).reduce((sum, l) => {
    if (l.type === '增加' || l.type === '补回') return sum + l.qty;
    return sum - l.qty; // 核销/失效/退款冲销
  }, 0);
}

/** 报名：生成快照 + 应收 + 权益初始记录（产品改价不影响旧报名） */
export function createEnrollment(db: DB, studentId: string, productId: string): string {
  const p = db.products.find(x => x.id === productId);
  const st = db.students.find(x => x.id === studentId);
  if (!p || !st) return '产品或学员不存在';
  if (p.status !== '可售') return '产品不是可售状态，不能报名';
  const en = {
    id: uid(), studentId, productId,
    snapshot: { productName: p.name, version: p.version, price: p.price, unit: p.unit, deductRule: p.deductRule, refundRule: p.refundRule, plannedCount: p.plannedCount },
    startDate: today(), totalUnits: p.plannedCount ?? 1, status: '服务中' as const, createdAt: today(),
  };
  db.enrollments.push(en);
  db.ledger.push({ id: uid(), enrollmentId: en.id, type: '增加', qty: en.totalUnits, unit: '课时', reason: `报名初始权益（快照 v${p.version}）`, createdAt: today() });
  db.finances.push({ id: uid(), kind: '应收', amountCents: Math.round(p.price * 100), currency: 'CNY', date: today(), enrollmentId: en.id, note: `${p.name} 报名应收（快照 v${p.version}）`, status: '正常', createdAt: today() });
  if (st.stage === '潜在' || st.stage === '已咨询') st.stage = '已报名';
  if (!st.firstEnrollDate) st.firstEnrollDate = today();
  return `报名成功：已锁定快照 v${p.version}（改价不影响本报名），生成应收 ¥${p.price}`;
}

/** 退款：按快照规则人工确认金额，生成退款记录 + 课时退款冲销（两端一致） */
export function refundEnrollment(db: DB, enrollmentId: string, amountYuan: number, unitsToRevoke: number, reason: string): string {
  const en = db.enrollments.find(e => e.id === enrollmentId);
  if (!en) return '报名不存在';
  db.finances.push({ id: uid(), kind: '退款', amountCents: Math.round(amountYuan * 100), currency: 'CNY', date: today(), enrollmentId, note: `退款：${reason}（按快照规则人工确认）`, status: '正常', createdAt: today() });
  if (unitsToRevoke > 0) {
    db.ledger.push({ id: uid(), enrollmentId, type: '退款冲销', qty: unitsToRevoke, unit: '课时', reason: `退款冲销：${reason}`, createdAt: today() });
  }
  en.status = '结案';
  return `已登记退款 ¥${amountYuan} 并冲销 ${unitsToRevoke} 课时（两端一致写入）`;
}

/** 财务冲销更正：不物理覆盖 */
export function reverseFinance(db: DB, id: string, reason: string): string {
  const f = db.finances.find(x => x.id === id);
  if (!f) return '记录不存在';
  if (f.status === '已冲销') return '该记录已冲销';
  const rev = { id: uid(), kind: f.kind, amountCents: -f.amountCents, currency: f.currency, date: today(), enrollmentId: f.enrollmentId, payer: f.payer, note: `冲销「${f.note}」：${reason}`, status: '正常' as const, createdAt: today() };
  db.finances.push(rev);
  f.status = '已冲销';
  f.reversedBy = rev.id;
  return '已生成冲销记录（原记录保留）';
}

/** 任务完成打卡与撤销（保留操作记录，不重复汇总） */
export function toggleTaskDone(db: DB, taskId: string): void {
  const t = db.tasks.find(x => x.id === taskId);
  if (!t) return;
  if (t.status === '完成') {
    t.status = '待处理';
    t.doneLog.push({ at: `${today()} ${nowHM()}`, action: '撤销' });
    delete t.doneAt;
  } else {
    t.status = '完成';
    t.doneAt = `${today()} ${nowHM()}`;
    t.doneLog.push({ at: t.doneAt, action: '完成' });
  }
}

/** 四象限反馈分类：作为规则反馈，只改这一条，不回填历史 */
export function setQuadrant(db: DB, taskId: string, q: Quadrant | null): void {
  const t = db.tasks.find(x => x.id === taskId);
  if (t) t.quadrant = q;
}

/** 时间冲突检测（精确到分钟，支持跨小时/半小时） */
export function hm2min(hm: string): number { const [h, m] = hm.split(':').map(Number); return h * 60 + m; }
export function conflicts(db: DB, date: string, start: string, end: string, excludeId?: string): Session[] {
  const s = hm2min(start), e = hm2min(end);
  return db.sessions.filter(x => x.date === date && x.status !== '已取消' && x.id !== excludeId)
    .filter(x => hm2min(x.start) < e && s < hm2min(x.end));
}

/** 提醒来源汇总（到期提醒，与四象限分开）：课次临近、任务到期、等待跟进日、反馈待交付 */
export function dueReminders(db: DB): { id: string; text: string; kind: string }[] {
  const list: { id: string; text: string; kind: string }[] = [];
  const t = today();
  db.sessions.filter(s => s.status === '计划' && s.date <= t).forEach(s => {
    list.push({ id: 'rem-s-' + s.id, text: `课次「${s.title}」${s.date < t ? '已过期未完成' : '今天 ' + s.start}`, kind: '课次临近' });
  });
  db.tasks.filter(x => x.status !== '完成' && x.status !== '取消' && !!x.dueDate && x.dueDate <= t).forEach(x => {
    const dd = x.dueDate as string;
    list.push({ id: 'rem-t-' + x.id, text: `任务「${x.title}」${dd < t ? '已超期' : '今天到期'}`, kind: '任务到期' });
  });
  db.tasks.filter(x => x.status === '等待中' && x.waitingNext && x.waitingNext <= t).forEach(x => {
    list.push({ id: 'rem-w-' + x.id, text: `等待跟进：${x.waitingFor ?? x.title}`, kind: '等待跟进' });
  });
  db.serviceRecords.filter(r => r.feedbackStatus !== '已交付').forEach(r => {
    const st = db.students.find(s => s.id === r.studentId);
    list.push({ id: 'rem-f-' + r.id, text: `反馈待交付/确认：${st?.name ?? ''} 第${r.seq}次（${r.feedbackStatus}）`, kind: '反馈待办' });
  });
  return list;
}

export function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
