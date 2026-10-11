// P01 今日工作台：八类内容 + 三重点 + 完成打卡 + 到期提醒（与四象限分开）
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDB, today, dueReminders, toggleTaskDone, uid } from '@/lib/store';
import { Section, StatusBadge, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Nav } from '@/App';

export default function Dashboard({ go }: { go: (n: Nav) => void }) {
  const [db, update] = useDB();
  const t = today();
  const [ideaText, setIdeaText] = useState('');

  const todaySessions = useMemo(() => db.sessions.filter(s => s.date === t && s.status !== '已取消').sort((a, b) => a.start.localeCompare(b.start)), [db.sessions, t]);
  const nextSession = todaySessions.find(s => s.status === '计划');
  const todayTasks = db.tasks.filter(x => x.status !== '取消' && (x.dueDate === t || x.status === '进行中') && x.status !== '完成');
  const doneToday = db.tasks.filter(x => x.doneAt?.startsWith(t));
  const doingProjects = db.devProjects.filter(p => p.milestones.some(m => !m.done));
  const pendingRecords = db.serviceRecords.filter(r => r.feedbackStatus !== '已交付' || r.archiveStatus !== '已归档');
  const reminders = dueReminders(db);
  const focus = db.topFocus.find(f => f.date === t);
  const focusTasks = (focus?.slots ?? [null, null, null]).map(id => db.tasks.find(x => x.id === id) ?? null);

  const setFocusSlot = (idx: number, taskId: string | null) => {
    update(d => {
      const cur = d.topFocus.find(f => f.date === t);
      if (cur) cur.slots[idx] = taskId;
      else d.topFocus.push({ date: t, slots: [null, null, null].map((_, i) => (i === idx ? taskId : null)) });
    });
  };

  const hourRange = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-stone-800">今日工作台</h1>
          <p className="text-xs text-stone-500 mt-0.5">{t} · 八类内容汇总自底层任务与服务记录，不重复填报</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => go({ page: 'schedule' })}>课表</Button>
          <Button size="sm" variant="outline" onClick={() => go({ page: 'tasks' })}>新建任务</Button>
        </div>
      </div>

      {/* 下一场服务 */}
      {nextSession ? (
        <button onClick={() => go({ page: 'schedule' })} className="w-full text-left rounded-xl border-l-4 bg-white p-4 shadow-sm hover:shadow transition-shadow" style={{ borderColor: '#98341F' }}>
          <p className="text-xs text-stone-500">下一场服务</p>
          <p className="font-semibold mt-1">{nextSession.start}—{nextSession.end} · {nextSession.title}</p>
          <p className="text-xs text-stone-500 mt-1">准备：{nextSession.prepNote ?? '无准备清单'}</p>
        </button>
      ) : (
        <div className="rounded-xl border bg-white p-4 text-sm text-stone-500">今天暂无安排中的服务，可到课表排课。</div>
      )}

      {/* 概览卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="今日计划" value={todaySessions.length + todayTasks.length} sub="课次 + 任务" onClick={() => go({ page: 'schedule' })} />
        <StatCard label="今日完成" value={doneToday.length} sub="以唯一任务为口径" onClick={() => go({ page: 'tasks' })} />
        <StatCard label="待整理记录" value={pendingRecords.length} sub="归档/反馈未完成" onClick={() => go({ page: 'clients' })} />
        <StatCard label="到期提醒" value={reminders.length} sub="含等待跟进与反馈待办" />
      </div>

      {/* 三重点 */}
      <Section title="今日最重要的三件事" accent="#98341F">
        <div className="grid sm:grid-cols-3 gap-2">
          {[0, 1, 2].map(i => {
            const task = focusTasks[i];
            return (
              <div key={i} className="rounded-lg border bg-[#FAF7F2] p-3 min-h-[64px]">
                {task ? (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <StatusBadge s={task.status} />
                    </div>
                    <button className="text-xs text-stone-400 hover:text-stone-600" onClick={() => setFocusSlot(i, null)}>移出</button>
                  </div>
                ) : (
                  <select className="w-full text-sm bg-transparent text-stone-400 outline-none" value="" onChange={e => e.target.value && setFocusSlot(i, e.target.value)}>
                    <option value="">空位 · 选择真实事项…</option>
                    {db.tasks.filter(x => x.status !== '完成' && x.status !== '取消' && !focusTasks.some(f => f?.id === x.id)).map(x => (
                      <option key={x.id} value={x.id}>{x.title}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">不足三件显示空位，不虚构任务；更换重点不覆盖原事项。</p>
      </Section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 左：任务与项目 */}
        <div className="space-y-4">
          <Section title="今天要做的事情" accent="#98341F" extra={<Button size="sm" variant="ghost" onClick={() => go({ page: 'tasks' })}>全部</Button>}>
            {todayTasks.length === 0 ? <p className="text-sm text-stone-400 py-3">今天没有到期任务。</p> : (
              <ul className="space-y-2">
                {todayTasks.map(x => (
                  <li key={x.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 accent-[#98341F]" checked={x.status === '完成'} onChange={() => { update(d => toggleTaskDone(d, x.id)); toast.success(x.status === '完成' ? '已撤销完成（记录保留）' : '已完成打卡'); }} />
                    <span className="flex-1">{x.title}</span>
                    <StatusBadge s={x.status} />
                    {x.quadrant ? <span className="text-[10px] text-violet-600">{x.quadrant}</span> : <span className="text-[10px] text-stone-400">待分类</span>}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="进行中项目" accent="#A45F55" extra={<Button size="sm" variant="ghost" onClick={() => go({ page: 'knowledge' })}>研发</Button>}>
            {doingProjects.length === 0 ? <p className="text-sm text-stone-400 py-3">暂无进行中项目。</p> : (
              <ul className="space-y-2">
                {doingProjects.map(p => {
                  const done = p.milestones.filter(m => m.done).length;
                  return (
                    <li key={p.id} className="text-sm">
                      <div className="flex justify-between"><span className="font-medium">{p.title}</span><span className="text-xs text-stone-400">{p.kind}</span></div>
                      <div className="mt-1 h-1.5 rounded bg-stone-100"><div className="h-1.5 rounded bg-[#A45F55]" style={{ width: `${(done / p.milestones.length) * 100}%` }} /></div>
                      <p className="text-[11px] text-stone-400 mt-1">{p.stage} · 里程碑 {done}/{p.milestones.length}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="待整理记录" accent="#42546A">
            {pendingRecords.length === 0 ? <p className="text-sm text-stone-400 py-3">没有待整理的服务记录。</p> : (
              <ul className="space-y-2 text-sm">
                {pendingRecords.map(r => {
                  const st = db.students.find(s => s.id === r.studentId);
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <button className="text-left hover:underline" onClick={() => go({ page: 'clients', param: r.studentId })}>{st?.name} · 第{r.seq}次</button>
                      <div className="flex gap-1"><StatusBadge s={r.archiveStatus} /><StatusBadge s={r.feedbackStatus} /></div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-[11px] text-stone-400 mt-2">日程结束 ≠ 总结完成：服务完成但反馈未交付时持续显示待办。</p>
          </Section>
        </div>

        {/* 右：时间轴 + 随手记 + 提醒 */}
        <div className="space-y-4">
          <Section title="今日时间安排（每小时刻度）" accent="#98341F" extra={<Button size="sm" variant="ghost" onClick={() => go({ page: 'schedule' })}>排课</Button>}>
            <div className="relative">
              {hourRange.map(h => {
                const blocks = todaySessions.filter(s => Number(s.start.slice(0, 2)) === h);
                return (
                  <div key={h} className="flex border-b border-dashed border-stone-100 min-h-[36px]">
                    <span className="w-12 text-[11px] text-stone-400 pt-1 shrink-0">{String(h).padStart(2, '0')}:00</span>
                    <div className="flex-1 py-0.5 space-y-1">
                      {blocks.map(s => (
                        <button key={s.id} onClick={() => go({ page: 'schedule' })}
                          className={`block w-full text-left text-xs rounded px-2 py-1 ${s.status === '已完成' ? 'bg-emerald-50 text-emerald-800' : 'bg-[#98341F]/10 text-[#98341F]'}`}>
                          {s.start}—{s.end} {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-400 mt-2">预约精确到分钟（如 09:30—10:15），不强制凑整。</p>
          </Section>

          <Section title="随手记 / 灵感" accent="#C28393" extra={<Button size="sm" variant="ghost" onClick={() => go({ page: 'knowledge' })}>灵感库</Button>}>
            <div className="flex gap-2">
              <Input value={ideaText} onChange={e => setIdeaText(e.target.value)} placeholder="先收集，后整理…" className="h-9 text-sm" />
              <Button size="sm" className="bg-[#C28393] hover:bg-[#b06f80] text-white shrink-0" onClick={() => {
                if (!ideaText.trim()) return;
                update(d => d.ideas.unshift({ id: uid(), text: ideaText.trim(), tags: [], status: '待整理', conversions: [], createdAt: t }));
                setIdeaText(''); toast.success('已收入灵感库');
              }}>记录</Button>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {db.ideas.slice(0, 3).map(i => (
                <li key={i.id} className="flex items-center justify-between gap-2"><span className="truncate">{i.text}</span><StatusBadge s={i.status} /></li>
              ))}
            </ul>
          </Section>

          <Section title="到期提醒（与四象限判断分开）" accent="#A86F59">
            {reminders.length === 0 ? <p className="text-sm text-stone-400 py-3">暂无到期提醒。</p> : (
              <ul className="space-y-1.5 text-sm">
                {reminders.map(r => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span>{r.text}</span>
                    <span className="text-[10px] rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 shrink-0">{r.kind}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-stone-400 mt-2">临近时间并不自动代表重要；重要性分类见「任务与时间」。</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
