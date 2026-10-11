// P03 客户/线索列表 + P04 学员详情（页签：概况/需求/服务记录/课时账/成绩/合同）
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today, balanceOf } from '@/lib/store';
import { PageHeader, Section, StatusBadge, EmptyState, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { StudentStage } from '@/types';
import type { Nav } from '@/App';

const STAGES: StudentStage[] = ['潜在', '已咨询', '已报名', '服务中', '暂停', '结案'];

export default function Clients({ focusId, go }: { focusId?: string; go: (n: Nav) => void }) {
  const [db, update] = useDB();
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('全部');
  const [selId, setSelId] = useState<string | null>(focusId ?? null);
  const [newName, setNewName] = useState('');

  const list = useMemo(() => db.students.filter(s => {
    if (stageFilter !== '全部' && s.stage !== stageFilter) return false;
    if (q && !(`${s.name}${s.school ?? ''}${s.tags.join('')}`).includes(q)) return false;
    return true;
  }), [db.students, q, stageFilter]);

  const sel = selId ? db.students.find(s => s.id === selId) : null;

  if (sel) return <StudentDetail id={sel.id} back={() => setSelId(null)} go={go} />;

  return (
    <div>
      <PageHeader title="客户与学员" color="#42546A" sub="家庭—联系人—学员三层建档；同一学员一份档案，查重建议前置、不自动合并"
        actions={<div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="新学员姓名/代号" className="w-40 h-9" />
          <Button size="sm" className="bg-[#42546A] text-white" onClick={() => {
            const name = newName.trim();
            if (!name) { toast.error('请输入姓名'); return; }
            const dup = db.students.find(s => s.name === name);
            if (dup && !window.confirm(`已存在同名学员「${name}」（${dup.stage}）。系统不自动合并档案，确认要新建独立档案吗？`)) return;
            update(d => d.students.unshift({ id: uid(), familyId: '', name, stage: '潜在', tags: [], createdAt: today() }));
            setNewName(''); toast.success('已建档（阶段：潜在）；其余信息可后补，不强制一次填全');
          }}>建档</Button>
        </div>} />

      <div className="flex gap-2 mb-3 flex-wrap">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索姓名/学校/标签" className="w-56 h-9" />
        {['全部', ...STAGES].map(s => (
          <Button key={s} size="sm" variant={stageFilter === s ? 'default' : 'outline'} className={stageFilter === s ? 'bg-[#42546A] text-white' : ''} onClick={() => setStageFilter(s)}>{s}</Button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState kind={q || stageFilter !== '全部' ? 'filtered' : 'empty'} />
      ) : (
        <div className="grid gap-2">
          {list.map(s => {
            const family = db.families.find(f => f.id === s.familyId);
            const ref = s.referredBy ? db.students.find(x => x.id === s.referredBy) : null;
            return (
              <button key={s.id} onClick={() => setSelId(s.id)} className="text-left rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs text-stone-400 ml-2">{[s.school, s.grade].filter(Boolean).join(' · ') || '信息待补'}</span>
                  </div>
                  <StatusBadge s={s.stage} />
                </div>
                <div className="mt-1.5 text-xs text-stone-500 flex flex-wrap gap-x-3 gap-y-1">
                  {family && <span>家庭：{family.name}</span>}
                  {s.channel && <span>渠道:{s.channel}</span>}
                  {ref && <span className="text-emerald-700">转介绍自：{ref.name}</span>}
                  {s.tags.map(t => <span key={t} className="rounded bg-stone-100 px-1.5">{t}</span>)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- P04 学员详情 ----
function StudentDetail({ id, back, go }: { id: string; back: () => void; go: (n: Nav) => void }) {
  const [db, update] = useDB();
  const stu = db.students.find(s => s.id === id)!;
  const family = db.families.find(f => f.id === stu.familyId);
  const contacts = db.contacts.filter(c => c.familyId === stu.familyId);
  const needs = db.needs.filter(n => n.studentId === id);
  const records = db.serviceRecords.filter(r => r.studentId === id).sort((a, b) => b.seq - a.seq);
  const enrollments = db.enrollments.filter(e => e.studentId === id);
  const exams = db.exams.filter(e => e.studentId === id).sort((a, b) => b.date.localeCompare(a.date));
  const docs = db.docRefs.filter(d => d.studentId === id);
  const [recId, setRecId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant="ghost" onClick={back}>← 列表</Button>
        <h1 className="text-xl font-bold flex items-center gap-2"><span className="w-2.5 h-6 rounded bg-[#42546A] inline-block" />{stu.name}</h1>
        <StatusBadge s={stu.stage} />
        <select className="ml-auto border rounded-md h-8 px-2 text-sm bg-white" value={stu.stage}
          onChange={e => { update(d => { d.students.find(x => x.id === id)!.stage = e.target.value as StudentStage; }); toast.success('阶段已更新（允许回流）'); }}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-xs text-stone-500 mb-3">
        {[stu.school, stu.grade].filter(Boolean).join(' · ') || '学校年级待补'} · 渠道：{stu.channel ?? '未填'} · 标签（工作观察，非人格诊断）：{stu.tags.join('、') || '无'}
        {family ? ` · 家庭：${family.name}` : ''} · 联系人：{contacts.map(c => `${c.name}(${c.relation}${c.isPayer ? '/付款人' : ''})`).join('、') || '未填'}
      </p>

      <Tabs defaultValue="records">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-stone-100">
          <TabsTrigger value="records">服务记录</TabsTrigger>
          <TabsTrigger value="needs">需求与目标</TabsTrigger>
          <TabsTrigger value="ledger">课时与报名</TabsTrigger>
          <TabsTrigger value="exams">成绩</TabsTrigger>
          <TabsTrigger value="docs">合同与资料</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-3">
          <Section title={`连续服务记录（共 ${records.length} 份）`} accent="#42546A"
            extra={<Button size="sm" variant="outline" onClick={() => {
              update(d => {
                const seq = d.serviceRecords.filter(r => r.studentId === id).length + 1;
                const rec = { id: uid(), studentId: id, seq, date: today(), summary: '', content: '', sourceType: '文字' as const, docLocation: '工作台存储', aiScope: '仅摘要可供 AI 使用', archiveStatus: '草稿' as const, feedbackStatus: '待整理' as const, pendingCheck: [], createdAt: today() };
                d.serviceRecords.unshift(rec);
                setRecId(rec.id);
              });
            }}>新增记录</Button>}>
            <p className="text-[11px] text-stone-400 mb-2">计划次数 / 已完成课次 / 已归档记录是三个口径：未存记录 ≠ 未上课，一份记录 ≠ 多扣一课。</p>
            {records.length === 0 ? <EmptyState kind="empty" /> : (
              <ul className="space-y-2">
                {records.map(r => (
                  <li key={r.id} className="rounded-lg border bg-[#FAF7F2] p-3">
                    <button className="w-full text-left" onClick={() => setRecId(recId === r.id ? null : r.id)}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm">第 {r.seq} 次 · {r.date}</span>
                        <div className="flex gap-1"><StatusBadge s={r.archiveStatus} /><StatusBadge s={r.feedbackStatus} /><span className="text-[10px] text-stone-400">{r.sourceType}</span></div>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{r.summary || '（摘要待整理）'}</p>
                    </button>
                    {recId === r.id && <RecordEditor recId={r.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="needs" className="mt-3">
          <Section title="需求与目标（学生 / 父母分开记录）" accent="#42546A"
            extra={<Button size="sm" variant="outline" onClick={() => {
              const proposer = window.prompt('提出者：学生 / 父母 / 共同', '父母');
              if (!proposer || !['学生', '父母', '共同'].includes(proposer)) return;
              const original = window.prompt('原话记录（保留提出者原话）');
              if (!original) return;
              update(d => d.needs.push({ id: uid(), studentId: id, proposer: proposer as '学生', original, status: '待确认', createdAt: today() }));
            }}>记录需求</Button>}>
            {needs.length === 0 ? <EmptyState kind="empty" /> : (
              <ul className="space-y-2 text-sm">
                {needs.map(n => (
                  <li key={n.id} className="rounded-lg border bg-[#FAF7F2] p-3 flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] rounded px-1.5 py-0.5 mr-2 ${n.proposer === '学生' ? 'bg-sky-100 text-sky-800' : n.proposer === '父母' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>{n.proposer}</span>
                      「{n.original}」{n.direction && <span className="text-xs text-stone-400 ml-2">方向：{n.direction}</span>}
                    </div>
                    <button onClick={() => update(d => { const x = d.needs.find(y => y.id === n.id)!; x.status = x.status === '已确认' ? '待确认' : '已确认'; })}>
                      <StatusBadge s={n.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="ledger" className="mt-3 space-y-3">
          {enrollments.length === 0 ? <EmptyState kind="empty" action="去产品页报名" onAction={() => go({ page: 'products' })} /> : enrollments.map(en => {
            const bal = balanceOf(db, en.id);
            const entries = db.ledger.filter(l => l.enrollmentId === en.id);
            const usedCount = db.sessions.filter(s => s.studentId === id && s.status === '已完成').length;
            return (
              <Section key={en.id} title={`${en.snapshot.productName}（快照 v${en.snapshot.version}）`} accent="#42546A">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-2">
                  <div className="rounded bg-[#FAF7F2] p-2"><p className="text-[10px] text-stone-400">计划次数</p><p className="font-semibold">{en.snapshot.plannedCount ?? '—'}</p></div>
                  <div className="rounded bg-[#FAF7F2] p-2"><p className="text-[10px] text-stone-400">已完成课次</p><p className="font-semibold">{usedCount}</p></div>
                  <div className="rounded bg-[#FAF7F2] p-2"><p className="text-[10px] text-stone-400">已归档记录</p><p className="font-semibold">{records.filter(r => r.archiveStatus === '已归档').length}</p></div>
                  <div className="rounded bg-[#FAF7F2] p-2"><p className="text-[10px] text-stone-400">剩余课时（账目复算）</p><p className="font-semibold">{bal}</p></div>
                </div>
                <p className="text-xs text-stone-500 mb-2">快照价 ¥{en.snapshot.price}/{en.snapshot.unit} · {en.snapshot.deductRule} · 退费：{en.snapshot.refundRule} · <StatusBadge s={en.status} /></p>
                <table className="w-full text-xs">
                  <thead><tr className="text-stone-400 text-left"><th className="py-1">日期</th><th>类型</th><th>数量</th><th>原因</th></tr></thead>
                  <tbody>
                    {entries.map(l => (
                      <tr key={l.id} className="border-t border-stone-100">
                        <td className="py-1">{l.createdAt}</td>
                        <td className={l.type === '增加' || l.type === '补回' ? 'text-emerald-700' : 'text-rose-700'}>{l.type}</td>
                        <td>{l.type === '增加' || l.type === '补回' ? '+' : '-'}{l.qty} {l.unit}</td>
                        <td className="text-stone-500">{l.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {en.status === '服务中' && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                    const amt = window.prompt(`按快照规则试算退款金额（元）。规则：${en.snapshot.refundRule}`, '0');
                    if (amt === null) return;
                    const units = window.prompt('同时冲销的剩余课时数', String(Math.max(bal, 0)));
                    if (units === null) return;
                    const reason = window.prompt('退款原因') ?? '家长申请';
                    import('@/lib/store').then(m => update(d => { const msg = m.refundEnrollment(d, en.id, Number(amt) || 0, Number(units) || 0, reason); toast.success(msg); }));
                  }}>申请退款（按快照规则）</Button>
                )}
              </Section>
            );
          })}
        </TabsContent>

        <TabsContent value="exams" className="mt-3">
          <Section title="成绩与阶段评价（历次不覆盖；缺考不记零）" accent="#42546A"
            extra={<Button size="sm" variant="outline" onClick={() => {
              const name = window.prompt('考试名称'); if (!name) return;
              update(d => d.exams.unshift({ id: uid(), studentId: id, date: today(), name, stage: stu.grade ?? '未填', subjects: [{ name: '数学', score: null, full: 120, status: '缺失' }], createdAt: '' } as never));
              toast.success('已创建考试记录草稿，可继续编辑科目');
            }}>新增考试</Button>}>
            {exams.length === 0 ? <EmptyState kind="empty" /> : (
              <div className="space-y-3">
                {exams.map(e => (
                  <div key={e.id} className="rounded-lg border bg-[#FAF7F2] p-3 text-sm">
                    <p className="font-medium">{e.name} <span className="text-xs text-stone-400 font-normal">{e.date} · 阶段：{e.stage}（升学后保留考试时阶段）</span></p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {e.subjects.map(su => (
                        <span key={su.name} className={`rounded px-2 py-0.5 text-xs ${su.status === '有效' ? 'bg-white border' : 'bg-stone-200 text-stone-500'}`}>
                          {su.name} {su.status === '有效' ? `${su.score}/${su.full}` : su.status}
                        </span>
                      ))}
                    </div>
                    {e.comment && <p className="text-xs text-stone-500 mt-1.5">{e.comment}</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-stone-400 mt-2">不同满分不做绝对值提升比较（如 78/120 与 89/120 可比，与 95/100 需换算口径）。</p>
          </Section>
        </TabsContent>

        <TabsContent value="docs" className="mt-3">
          <Section title="合同与资料（三层信息：原件在哪里 / 工作台保存什么 / AI 可使用什么）" accent="#42546A">
            {docs.length === 0 ? <EmptyState kind="empty" /> : (
              <ul className="space-y-2 text-sm">
                {docs.map(d => (
                  <li key={d.id} className="rounded-lg border bg-[#FAF7F2] p-3">
                    <div className="flex items-center justify-between"><span className="font-medium">{d.title}</span><span className="text-[10px] text-stone-400">{d.storageType}</span></div>
                    <div className="mt-1 grid sm:grid-cols-3 gap-1.5 text-xs">
                      <p className="rounded bg-white p-1.5"><span className="text-stone-400">原件：</span>{d.location}{d.storageType === '老师电脑本地' && <span className="block text-amber-700 mt-0.5">本地路径，工作台不能直接打开，可复制路径手动定位</span>}</p>
                      <p className="rounded bg-white p-1.5"><span className="text-stone-400">工作台保存：</span>{d.summary}</p>
                      <p className="rounded bg-white p-1.5"><span className="text-stone-400">AI 可使用：</span>{d.aiScope}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 服务记录整理编辑（S3 Skill 流程的系统侧：事实/观察/约定/待核对分开；归档与反馈状态独立）
function RecordEditor({ recId }: { recId: string }) {
  const [db, update] = useDB();
  const r = db.serviceRecords.find(x => x.id === recId)!;
  return (
    <div className="mt-3 pt-3 border-t space-y-2 text-sm">
      <Field label="来源方式（不强制统一记录方式）">
        <select className="border rounded-md h-8 px-2 text-sm bg-white" value={r.sourceType}
          onChange={e => update(d => { d.serviceRecords.find(x => x.id === recId)!.sourceType = e.target.value as typeof r.sourceType; })}>
          {['文字', '手写识别', '录音转写'].map(x => <option key={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="摘要"><Input value={r.summary} onChange={e => update(d => { d.serviceRecords.find(x => x.id === recId)!.summary = e.target.value; })} placeholder="一句话摘要" /></Field>
      <Field label="整理稿（建议结构：事实/观察/约定/待办/待核对，可不全）">
        <textarea className="w-full border rounded-md p-2 text-sm min-h-[100px] bg-white" value={r.content}
          onChange={e => update(d => { d.serviceRecords.find(x => x.id === recId)!.content = e.target.value; })}
          placeholder="【事实】…【观察】…【约定】…【待核对】无法辨认的内容保留原片段并标疑问" />
      </Field>
      <Field label="待核对项（模糊识别/矛盾不补成事实，逗号分隔）">
        <Input value={r.pendingCheck.join('，')} onChange={e => update(d => { d.serviceRecords.find(x => x.id === recId)!.pendingCheck = e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean); })} />
      </Field>
      <div className="flex flex-wrap gap-2 pt-1">
        {(['草稿', '待核对', '已归档'] as const).map(s => (
          <Button key={s} size="sm" variant={r.archiveStatus === s ? 'default' : 'outline'} className={r.archiveStatus === s ? 'bg-[#42546A] text-white' : ''}
            onClick={() => { update(d => { d.serviceRecords.find(x => x.id === recId)!.archiveStatus = s; }); toast.success(`归档状态 → ${s}`); }}>{s}</Button>
        ))}
        <span className="w-px bg-stone-200 mx-1" />
        {(['待整理', '待确认', '待交付', '已交付'] as const).map(s => (
          <Button key={s} size="sm" variant={r.feedbackStatus === s ? 'default' : 'outline'} className={r.feedbackStatus === s ? 'bg-[#7D6477] text-white' : ''}
            onClick={() => {
              if (s === '已交付' && !window.confirm('确认反馈已交付给家长？（验证版为工作台外发送 + 回执登记）')) return;
              update(d => { d.serviceRecords.find(x => x.id === recId)!.feedbackStatus = s; });
              toast.success(`反馈状态 → ${s}`);
            }}>反馈:{s}</Button>
        ))}
      </div>
      <p className="text-[11px] text-stone-400">归档 ≠ 外发：家长版默认不含内部判断与老师观察；确认交付后首页待办才会消除。</p>
    </div>
  );
}
