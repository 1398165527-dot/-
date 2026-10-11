// P14 任务：四象限（个人判断）与到期提醒（日期规则）分开；等待中事项；完成打卡可撤销
import { useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today, toggleTaskDone, setQuadrant } from '@/lib/store';
import { PageHeader, Section, StatusBadge, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Quadrant } from '@/types';

const QUADS: Quadrant[] = ['重要且紧急', '重要不紧急', '紧急不重要', '不重要不紧急'];

export default function Tasks() {
  const [db, update] = useDB();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [filter, setFilter] = useState<'全部' | '未完成' | '等待中' | '完成'>('未完成');

  const rows = db.tasks.filter(t => {
    if (filter === '未完成') return t.status !== '完成' && t.status !== '取消';
    if (filter === '全部') return true;
    return t.status === filter;
  }).sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));

  return (
    <div>
      <PageHeader title="任务与时间" color="#98341F" sub="A 到期提醒依据明确日期；B 四象限依据老师个人规则——两者分开，临近≠重要" />

      <Section title="新建任务" accent="#98341F">
        <div className="flex flex-wrap gap-2">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="任务标题（关联对象可在创建后补充）" className="flex-1 min-w-[220px]" />
          <Input type="date" value={due} onChange={e => setDue(e.target.value)} className="w-40" />
          <Button className="bg-[#98341F] hover:bg-[#7d2a19] text-white" onClick={() => {
            if (!title.trim()) { toast.error('请填写标题'); return; }
            update(d => d.tasks.unshift({ id: uid(), title: title.trim(), status: '待处理', quadrant: null, dueDate: due || undefined, source: '手工', doneLog: [], createdAt: today() }));
            setTitle(''); setDue('');
            toast.success(due ? '已创建' : '已创建（无截止日期，不会虚构期限）');
          }}>创建</Button>
        </div>
      </Section>

      <div className="flex gap-2 my-3 flex-wrap">
        {(['未完成', '等待中', '完成', '全部'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className={filter === f ? 'bg-[#98341F] text-white' : ''} onClick={() => setFilter(f)}>{f}</Button>
        ))}
        <p className="text-xs text-stone-400 self-center ml-auto">未完成个人规则引导时，重要性显示「待分类」，不伪装已知判断。</p>
      </div>

      {rows.length === 0 ? <EmptyState kind={filter === '未完成' ? 'empty' : 'filtered'} /> : (
        <div className="space-y-2">
          {rows.map(t => (
            <div key={t.id} className="rounded-xl border bg-white p-3">
              <div className="flex items-start gap-2 flex-wrap">
                <input type="checkbox" className="w-4 h-4 mt-1 accent-[#98341F]" checked={t.status === '完成'} onChange={() => { update(d => toggleTaskDone(d, t.id)); toast.success(t.status === '完成' ? '已撤销完成（操作记录保留）' : '完成打卡'); }} />
                <div className="flex-1 min-w-[200px]">
                  <p className={`text-sm font-medium ${t.status === '完成' ? 'line-through text-stone-400' : ''}`}>{t.title}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    来源：{t.source}{t.linkedLabel ? ` · 关联：${t.linkedLabel}` : ''}
                    {t.dueDate ? ` · 到期：${t.dueDate}` : ' · 无截止日期'}
                    {t.doneLog.length > 0 && ` · 打卡记录 ${t.doneLog.length} 次`}
                  </p>
                  {t.status === '等待中' && (
                    <p className="text-[11px] text-amber-700 mt-0.5">等待：{t.waitingFor} · 下次跟进 {t.waitingNext ?? '未定'}（等待 ≠ 完成）</p>
                  )}
                </div>
                <StatusBadge s={t.status} />
                {t.dueDate && <span className="text-[10px] rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">A 到期</span>}
                <span className="text-[10px] rounded bg-violet-100 text-violet-800 px-1.5 py-0.5">B {t.quadrant ?? '待分类'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                {QUADS.map(q => (
                  <Button key={q} size="sm" variant="outline" className={`h-7 text-[11px] ${t.quadrant === q ? 'border-violet-500 text-violet-700' : ''}`}
                    onClick={() => { update(d => setQuadrant(d, t.id, t.quadrant === q ? null : q)); }}>
                    {q}
                  </Button>
                ))}
                {t.status !== '完成' && t.status !== '取消' && (
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => {
                    update(d => {
                      const x = d.tasks.find(y => y.id === t.id)!;
                      if (x.status === '等待中') { x.status = '待处理'; delete x.waitingFor; delete x.waitingNext; }
                      else {
                        const w = window.prompt('等待谁 / 等待什么？'); if (w === null) return;
                        x.status = '等待中'; x.waitingFor = w || '未说明'; x.waitingNext = today();
                      }
                    });
                  }}>{t.status === '等待中' ? '解除等待' : '转为等待'}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
