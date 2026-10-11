// P18 知识库 + P19 灵感 + P20 研发项目（知识与灵感页）
import { useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today } from '@/lib/store';
import { PageHeader, Section, StatusBadge, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Knowledge() {
  const [db, update] = useDB();
  const [ideaText, setIdeaText] = useState('');
  const [kTitle, setKTitle] = useState('');

  return (
    <div>
      <PageHeader title="知识与灵感" color="#747CBD" sub="知识三分区（公共/个人/受限）；灵感先收集后整理，一条灵感可有多个去向" />
      <Tabs defaultValue="ideas">
        <TabsList className="bg-stone-100">
          <TabsTrigger value="ideas">灵感库</TabsTrigger>
          <TabsTrigger value="knowledge">知识库</TabsTrigger>
          <TabsTrigger value="dev">研发项目</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-3">
          <Section title="随手收集" accent="#C28393">
            <div className="flex gap-2">
              <Input value={ideaText} onChange={e => setIdeaText(e.target.value)} placeholder="文字 / 链接 / 想法，先收集后整理…" />
              <Button className="bg-[#C28393] hover:bg-[#b06f80] text-white shrink-0" onClick={() => {
                if (!ideaText.trim()) return;
                update(d => d.ideas.unshift({ id: uid(), text: ideaText.trim(), tags: [], status: '待整理', conversions: [], createdAt: today() }));
                setIdeaText(''); toast.success('已收集');
              }}>收集</Button>
            </div>
          </Section>
          {db.ideas.length === 0 ? <EmptyState kind="empty" /> : (
            <div className="space-y-2 mt-3">
              {db.ideas.map(i => (
                <div key={i.id} className="rounded-xl border bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p>{i.text}</p><StatusBadge s={i.status} />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">{i.createdAt} · 标签：{i.tags.join('、') || '未分类'}</p>
                  {i.conversions.length > 0 && <p className="text-[11px] text-emerald-700 mt-1">已转化为：{i.conversions.map(c => `${c.kind}「${c.label}」`).join('、')}（保留原文与来源可回溯）</p>}
                  {i.status === '待整理' && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['研发项目', '内容选题', '学习任务', '合作机会'].map(kind => (
                        <Button key={kind} size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => {
                          const label = window.prompt(`转化为「${kind}」的名称`, i.text.slice(0, 20));
                          if (label === null) return;
                          update(d => {
                            const x = d.ideas.find(y => y.id === i.id)!;
                            x.conversions.push({ kind, label: label || i.text.slice(0, 20), at: today() });
                            x.status = '已转化';
                          });
                          toast.success(`已转化为${kind}（一条灵感可有多个去向）`);
                        }}>转{kind}</Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledge" className="mt-3">
          <Section title="知识库（存储权限与 AI 使用范围分别设置）" accent="#747CBD"
            extra={<div className="flex gap-2">
              <Input value={kTitle} onChange={e => setKTitle(e.target.value)} placeholder="新条目名称" className="w-44 h-8" />
              <Button size="sm" variant="outline" onClick={() => {
                if (!kTitle.trim()) return;
                update(d => d.knowledge.unshift({ id: uid(), title: kTitle.trim(), source: '手工录入', zone: '老师个人', aiAllowed: true, summary: '', createdAt: today() }));
                setKTitle(''); toast.success('已收录（默认：老师个人分区）');
              }}>收录</Button>
            </div>}>
            <ul className="space-y-2 text-sm">
              {db.knowledge.map(k => (
                <li key={k.id} className="rounded-lg border bg-[#FAF7F2] p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-medium">{k.title}</span>
                    <div className="flex gap-1 items-center">
                      <StatusBadge s={k.zone} />
                      <button onClick={() => update(d => { const x = d.knowledge.find(y => y.id === k.id)!; x.aiAllowed = !x.aiAllowed; })}>
                        <span className={`text-[10px] rounded px-1.5 py-0.5 ${k.aiAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>AI {k.aiAllowed ? '可用' : '禁用'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{k.summary || '（摘要待补）'} · 来源：{k.source}</p>
                  {k.zone === '受限学员' && <p className="text-[11px] text-rose-700 mt-1">受限资料：默认不进入对外写作与 AI 上下文；匿名案例须人工审阅后才可转公共。</p>}
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="dev" className="mt-3">
          <Section title="课程与教育产品研发（沙龙小班 / 学习力营 / 教育产品）" accent="#A45F55">
            {db.devProjects.length === 0 ? <EmptyState kind="empty" /> : (
              <div className="space-y-3">
                {db.devProjects.map(p => (
                  <div key={p.id} className="rounded-xl border bg-white p-4 text-sm">
                    <div className="flex items-center justify-between"><p className="font-medium">{p.title}</p><span className="text-xs text-stone-400">{p.kind} · {p.stage}</span></div>
                    <ul className="mt-2 space-y-1">
                      {p.milestones.map((m, i) => (
                        <li key={i} className="flex items-center gap-2 text-[13px]">
                          <input type="checkbox" className="w-3.5 h-3.5 accent-[#A45F55]" checked={m.done} onChange={() => update(d => { const x = d.devProjects.find(y => y.id === p.id)!; x.milestones[i].done = !x.milestones[i].done; })} />
                          <span className={m.done ? 'line-through text-stone-400' : ''}>{m.label}</span>
                        </li>
                      ))}
                    </ul>
                    {p.nextAction && <p className="text-xs text-stone-500 mt-2">下一行动：{p.nextAction}（研发时间进入课表外工作日程；等待不计投入）</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-stone-400 mt-2">研发流程：灵感 → 人群与问题 → 概念定位 → 结构交付 → 资料原型 → 小规模试用 → 反馈迭代 → 发布 → 复盘。</p>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
