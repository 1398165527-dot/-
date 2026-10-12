// P08 课表 + P09 服务工作页 + P10 签到（整合为日程页，课次详情抽屉承载服务操作）
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today, checkin, completeSession, correctAttendance, conflicts, hm2min, balanceOf } from '@/lib/store';
import { PageHeader, Section, StatusBadge, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Session, SessionType, AttStatus } from '@/types';
import type { Nav } from '@/App';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00—21:00 显示范围

export default function Schedule({ go }: { go: (n: Nav) => void }) {
  const [db, update] = useDB();
  const [date, setDate] = useState(today());
  const [editing, setEditing] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', type: '一对一咨询' as SessionType, studentId: '', start: '09:30', end: '10:15', location: '', prepNote: '' });

  const daySessions = useMemo(() => db.sessions.filter(s => s.date === date && s.status !== '已取消').sort((a, b) => a.start.localeCompare(b.start)), [db.sessions, date]);
  const conflictList = conflicts(db, date, form.start, form.end);
  const invalidRange = hm2min(form.end) <= hm2min(form.start);

  const createSession = () => {
    if (!form.title.trim()) { toast.error('请填写标题'); return; }
    if (invalidRange) { toast.error('结束时间必须晚于开始时间'); return; }
    update(d => d.sessions.push({
      id: uid(), title: form.title.trim(), type: form.type, studentId: form.studentId || undefined,
      date, start: form.start, end: form.end, location: form.location || undefined,
      prepNote: form.prepNote || undefined, status: '计划',
    }));
    setCreating(false);
    toast.success(conflictList.length ? '已保存（存在时间重叠，请确认安排）' : '已排课');
  };

  const studentOf = (s: Session) => db.students.find(x => x.id === s.studentId);

  return (
    <div>
      <PageHeader title="课表与日程" color="#98341F" sub="每小时刻度显示范围可自定义；预约起止精确到分钟，不强制凑整"
        actions={<>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40 h-9" />
          <Button size="sm" className="bg-[#98341F] hover:bg-[#7d2a19] text-white" onClick={() => setCreating(true)}>排课 / 预约</Button>
        </>} />

      <Section title={`${date} 时间轴`} accent="#98341F">
        {daySessions.length === 0 && <p className="text-sm text-stone-400 pb-2">当日暂无安排（空状态：尚未排课）。</p>}
        <div className="relative">
          {HOURS.map(h => {
            const blocks = daySessions.filter(s => Number(s.start.slice(0, 2)) === h);
            return (
              <div key={h} className="flex border-b border-dashed border-stone-100 min-h-[40px]">
                <span className="w-14 text-[11px] text-stone-400 pt-1.5 shrink-0">{String(h).padStart(2, '0')}:00</span>
                <div className="flex-1 py-1 space-y-1">
                  {blocks.map(s => (
                    <button key={s.id} onClick={() => setEditing(s)}
                      className={`block w-full text-left text-sm rounded-lg px-3 py-1.5 border ${s.status === '已完成' ? 'bg-emerald-50 border-emerald-200' : 'bg-white hover:shadow-sm'}`}>
                      <span className="font-mono text-xs text-stone-500 mr-2">{s.start}—{s.end}</span>
                      <span className="font-medium">{s.title}</span>
                      <span className="ml-2"><StatusBadge s={s.status} /></span>
                      <span className="ml-2 text-xs text-stone-400">{s.type}{s.location ? ' · ' + s.location : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 新建预约 */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>排课 / 预约（{date}）</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="标题"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="如：林小舟 第5次咨询" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="类型">
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as SessionType })}>
                  {['一对一咨询', '班课', '陪跑', '研发', '个人'].map(x => <option key={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="关联学员（可选）">
                <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                  <option value="">不关联</option>
                  {db.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label="开始（精确到分钟）"><Input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></Field>
              <Field label="结束（精确到分钟）"><Input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></Field>
            </div>
            <Field label="地点 / 方式"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="线上 / 教室A" /></Field>
            <Field label="准备清单"><Input value={form.prepNote} onChange={e => setForm({ ...form, prepNote: e.target.value })} placeholder="课前要准备的资料" /></Field>
            {invalidRange && <p className="text-xs text-rose-600">结束时间必须晚于开始时间。</p>}
            {!invalidRange && conflictList.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
                时间重叠提示：与「{conflictList.map(c => `${c.title}(${c.start}—${c.end})`).join('、')}」冲突。
              </p>
            )}
            <Button className="w-full bg-[#98341F] hover:bg-[#7d2a19] text-white" onClick={createSession}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 课次详情：服务工作页 */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {editing && (() => {
            const s = db.sessions.find(x => x.id === editing.id)!;
            const stu = studentOf(s);
            const atts = db.attendance.filter(a => a.sessionId === s.id);
            const en = stu ? db.enrollments.find(e => e.studentId === stu.id && e.status === '服务中') : undefined;
            return (
              <>
                <DialogHeader><DialogTitle>{s.title}</DialogTitle></DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2 items-center text-stone-500">
                    <span className="font-mono">{s.date} {s.start}—{s.end}</span>
                    <StatusBadge s={s.status} />
                    <span>{s.type}{s.location ? ' · ' + s.location : ''}</span>
                    {stu && <button className="text-sky-700 hover:underline" onClick={() => { setEditing(null); go({ page: 'clients', param: stu.id }); }}>查看学员档案 →</button>}
                  </div>

                  {/* P08：线上考勤保留腾讯会议；发链接/点击/参会/有效出勤是不同状态 */}
                  {(s.location === '线上' || s.meetingProvider) && (
                    <Section title="会议信息（腾讯会议保留，不强制迁移）" accent="#98341F">
                      <div className="grid grid-cols-2 gap-2 items-end">
                        <Field label="会议平台">
                          <select className="w-full border rounded-md h-8 px-2 text-sm bg-white" value={s.meetingProvider ?? '腾讯会议'}
                            onChange={e => update(d => { d.sessions.find(x => x.id === s.id)!.meetingProvider = e.target.value as Session['meetingProvider']; })}>
                            {['腾讯会议', '飞书会议', '其他', '线下'].map(x => <option key={x}>{x}</option>)}
                          </select>
                        </Field>
                        <Field label="会议号 / 链接（人工维护）">
                          <Input value={s.meetingId ?? ''} placeholder="如 123-456-789"
                            onChange={e => update(d => { d.sessions.find(x => x.id === s.id)!.meetingId = e.target.value; })} />
                        </Field>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1.5">发链接 ≠ 点击 ≠ 参会 ≠ 有效出勤；参会记录自动匹配需账号 API 能力（当前待验证），此前签到为手动确认，无证据不自动判缺勤。</p>
                    </Section>
                  )}

                  <Section title="课前准备" accent="#98341F">
                    <p className="text-stone-600">{s.prepNote ?? '未填写准备清单'}</p>
                  </Section>

                  <Section title="到场签到（幂等）" accent="#42546A">
                    {stu ? (
                      <div className="space-y-2">
                        {atts.length > 0 ? atts.map(a => (
                          <div key={a.id} className="flex items-center justify-between gap-2 flex-wrap">
                            <span>{stu.name} <StatusBadge s={a.status} />
                              <span className={`text-[10px] rounded px-1.5 py-0.5 ml-1 ${a.evidence === '参会证据匹配' ? 'bg-emerald-100 text-emerald-800' : a.evidence === '未确认' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>证据：{a.evidence ?? '手动确认'}</span>
                              <span className="text-xs text-stone-400 ml-1">{a.checkinAt.replace('T', ' ')}</span></span>
                            <div className="flex gap-1">
                              {(['出勤', '迟到', '请假', '缺勤'] as AttStatus[]).filter(x => x !== a.status).map(x => (
                                <Button key={x} size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                                  const reason = window.prompt(`更正为「${x}」的原因（保留原记录）`);
                                  if (reason === null) return;
                                  update(d => { const msg = correctAttendance(d, a.id, x, reason || '未填写'); toast.success(msg); });
                                }}>改{x}</Button>
                              ))}
                            </div>
                          </div>
                        )) : <p className="text-stone-400">尚未签到。</p>}
                        <Button size="sm" variant="outline" onClick={() => {
                          update(d => { const r = checkin(d, s.id, stu.id); r.created ? toast.success(r.reason) : toast.info(r.reason); });
                        }}>{atts.length ? '再次签到（验证幂等）' : '签到'}</Button>
                        {en && <p className="text-[11px] text-stone-400">产品规则「{en.snapshot.deductRule}」· 剩余课时 {balanceOf(db, en.id)}</p>}
                      </div>
                    ) : <p className="text-stone-400">班课/研发类课次在学员档案中进行逐人考勤（验证版支持单学员课次签到）。</p>}
                  </Section>

                  <Section title="服务完成与课后" accent="#7D6477">
                    <div className="flex flex-wrap gap-2">
                      {s.status === '计划' && (
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => {
                          update(d => { const msg = completeSession(d, s.id); toast.success(msg); });
                        }}>标记服务完成</Button>
                      )}
                      {s.status === '计划' && (
                        <Button size="sm" variant="outline" onClick={() => {
                          update(d => { const x = d.sessions.find(y => y.id === s.id)!; x.status = '已取消'; });
                          toast.success('已取消（时间过去不会自动完成，必须显式操作）');
                        }}>取消课次</Button>
                      )}
                      {s.status === '已完成' && stu && (
                        <Button size="sm" variant="outline" onClick={() => {
                          update(d => {
                            const seq = d.serviceRecords.filter(r => r.studentId === stu.id).length + 1;
                            d.serviceRecords.unshift({
                              id: uid(), studentId: stu.id, sessionId: s.id, seq, date: today(),
                              summary: '', content: '', sourceType: '文字', docLocation: '工作台存储',
                              aiScope: '仅摘要可供 AI 使用', archiveStatus: '草稿', feedbackStatus: '待整理',
                              pendingCheck: [], createdAt: today(),
                            });
                          });
                          setEditing(null); go({ page: 'clients', param: stu.id });
                          toast.success('已创建服务记录草稿，请到学员档案整理归档');
                        }}>整理本次服务记录 →</Button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-2">签到、服务完成、课时核销、记录归档、反馈交付是五件独立的事。</p>
                  </Section>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
