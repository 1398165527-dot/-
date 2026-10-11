// P02 年/月/周/日多层规划（同一数据不同粒度视图，切换不复制数据）
import { useMemo, useState } from 'react';
import { useDB, today } from '@/lib/store';
import { PageHeader, Section, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';

type Level = '年' | '月' | '周' | '日';

export default function Planning() {
  const [db] = useDB();
  const [level, setLevel] = useState<Level>('周');
  const t = today();
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1 + i);
    return d.toISOString().slice(0, 10);
  }), []);
  const monthDays = useMemo(() => {
    const d = new Date(); const y = d.getFullYear(), m = d.getMonth();
    const n = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
  }, []);

  const sessionsOn = (date: string) => db.sessions.filter(s => s.date === date && s.status !== '已取消');
  const tasksDue = (date: string) => db.tasks.filter(x => x.dueDate === date && x.status !== '完成' && x.status !== '取消');
  const waitingOverdue = db.tasks.filter(x => x.status === '等待中' && x.waitingNext && x.waitingNext <= t);

  return (
    <div>
      <PageHeader title="年月周日规划" color="#98341F" sub="年度方向 → 月度重点 → 周计划 → 今日任务；同一事项跨层显示，不复制多份"
        actions={<div className="flex gap-1">
          {(['年', '月', '周', '日'] as Level[]).map(l => (
            <Button key={l} size="sm" variant={level === l ? 'default' : 'outline'} className={level === l ? 'bg-[#98341F] text-white' : ''} onClick={() => setLevel(l)}>{l}</Button>
          ))}
        </div>} />

      {level === '年' && (
        <Section title={`${new Date().getFullYear()} 年度总览`} accent="#98341F">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-[#FAF7F2] p-3"><p className="text-xs text-stone-400">事业方向（来自画像 v{db.profile.current.version}）</p><p className="mt-1">{db.profile.current.vision}</p></div>
            <div className="rounded-lg bg-[#FAF7F2] p-3"><p className="text-xs text-stone-400">十年目标</p><p className="mt-1">{db.profile.current.tenYearGoal}</p></div>
            <div className="rounded-lg bg-[#FAF7F2] p-3">
              <p className="text-xs text-stone-400">产品与研发里程碑</p>
              <ul className="mt-1 space-y-1">
                {db.devProjects.map(p => <li key={p.id}>· {p.title}（{p.stage}）</li>)}
                {db.products.filter(p => p.status === '可售').map(p => <li key={p.id}>· 在售：{p.name} v{p.version}</li>)}
              </ul>
            </div>
            <p className="text-[11px] text-stone-400">年度方向不直接生成满排日程；老师先确认阶段重点。年倒计时取当前年，不固定参考年份。</p>
          </div>
        </Section>
      )}

      {level === '月' && (
        <Section title="月度视图（点击日期进入当日）" accent="#98341F">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-stone-400 mb-1">
            {['一', '二', '三', '四', '五', '六', '日'].map(d => <span key={d}>周{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (new Date(monthDays[0]).getDay() + 6) % 7 }).map((_, i) => <div key={'e' + i} />)}
            {monthDays.map(d => {
              const ss = sessionsOn(d), ts = tasksDue(d);
              return (
                <button key={d} onClick={() => setLevel('日')} className={`rounded-lg border p-1.5 min-h-[52px] text-left hover:shadow-sm ${d === t ? 'border-[#98341F] bg-[#98341F]/5' : 'bg-white'}`}>
                  <p className="text-[11px] text-stone-500">{Number(d.slice(8))}</p>
                  {ss.length > 0 && <p className="text-[10px] text-[#98341F] truncate">{ss.length} 场课</p>}
                  {ts.length > 0 && <p className="text-[10px] text-amber-700 truncate">{ts.length} 任务</p>}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {level === '周' && (
        <div className="space-y-3">
          <Section title="本周课表与任务" accent="#98341F">
            <div className="grid sm:grid-cols-7 gap-1.5">
              {weekDays.map(d => {
                const ss = sessionsOn(d), ts = tasksDue(d);
                return (
                  <div key={d} className={`rounded-lg border p-2 min-h-[90px] ${d === t ? 'border-[#98341F] bg-[#98341F]/5' : 'bg-white'}`}>
                    <p className="text-[11px] text-stone-500">{d.slice(5)}{d === t ? ' · 今天' : ''}</p>
                    {ss.map(s => <p key={s.id} className="text-[11px] mt-1 text-[#98341F]">{s.start} {s.title}</p>)}
                    {ts.map(x => <p key={x.id} className="text-[11px] mt-1 text-amber-700 truncate">◦ {x.title}</p>)}
                    {ss.length + ts.length === 0 && <p className="text-[10px] text-stone-300 mt-2">—</p>}
                  </div>
                );
              })}
            </div>
          </Section>
          <Section title="超期等待检查（每周检查一次，不每天机械复制）" accent="#A86F59">
            {waitingOverdue.length === 0 ? <p className="text-sm text-stone-400">没有超期等待事项。</p> : (
              <ul className="text-sm space-y-1">{waitingOverdue.map(x => <li key={x.id}>· {x.waitingFor ?? x.title}（跟进日 {x.waitingNext}）</li>)}</ul>
            )}
          </Section>
        </div>
      )}

      {level === '日' && (
        <Section title={`${t} 当日视图`} accent="#98341F">
          <ul className="space-y-2 text-sm">
            {sessionsOn(t).map(s => <li key={s.id} className="flex gap-2 items-center"><span className="font-mono text-xs text-stone-500">{s.start}—{s.end}</span>{s.title}<StatusBadge s={s.status} /></li>)}
            {tasksDue(t).map(x => <li key={x.id} className="flex gap-2 items-center"><span className="text-xs text-amber-700">任务</span>{x.title}<StatusBadge s={x.status} /></li>)}
            {sessionsOn(t).length + tasksDue(t).length === 0 && <p className="text-stone-400">今日暂无安排。</p>}
          </ul>
          <p className="text-[11px] text-stone-400 mt-2">完整时间轴见「今日工作台」；返回上层保留原日期与筛选。</p>
        </Section>
      )}
    </div>
  );
}
