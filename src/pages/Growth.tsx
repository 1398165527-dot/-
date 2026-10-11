// P16/P17 人生事业画像与阶段复盘（AI 草稿 → 人工逐项确认 → 新版本；拒绝则画像不变）
import { useState } from 'react';
import { toast } from 'sonner';
import { useDB, today } from '@/lib/store';
import { PageHeader, Section, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Growth() {
  const [db, update] = useDB();
  const p = db.profile.current;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ vision: p.vision, advantages: p.advantages, tenYearGoal: p.tenYearGoal, currentGap: p.currentGap });

  // 模拟「阶段复盘」：AI 建议生成入口（验证版为人工模拟 AI 草稿，正式版接入国内模型）
  const [aiDraft, setAiDraft] = useState<{ field: string; oldVal: string; suggestion: string; accepted: boolean | null }[] | null>(null);

  const genReview = () => {
    setAiDraft([
      { field: 'currentGap', oldVal: p.currentGap, suggestion: '（AI 草稿示例）近期公域内容产出稳定，可补充「内容转化路径不清晰」为新的差距项', accepted: null },
      { field: 'advantages', oldVal: p.advantages, suggestion: '（AI 草稿示例）优势可补充「小班课控场」', accepted: null },
    ]);
    toast.info('AI 复盘草稿已生成（示例）：逐项确认后才生效，拒绝则正式画像不变');
  };

  const applyConfirmed = () => {
    if (!aiDraft) return;
    const chosen = aiDraft.filter(x => x.accepted === true);
    if (chosen.length === 0) { toast.info('未接受任何建议，画像保持不变'); setAiDraft(null); return; }
    update(d => {
      const cur = d.profile.current;
      const next = { ...cur, version: cur.version + 1, effectiveDate: today() };
      chosen.forEach(c => { if (c.field === 'currentGap') next.currentGap = c.suggestion.replace('（AI 草稿示例）', ''); if (c.field === 'advantages') next.advantages = c.suggestion.replace('（AI 草稿示例）', ''); });
      d.profile.history.unshift(cur);
      d.profile.current = next;
    });
    setAiDraft(null);
    toast.success(`已生成画像新版本（仅 ${chosen.length} 项被接受的修改生效，旧版本可回溯）`);
  };

  return (
    <div>
      <PageHeader title="人生与事业" color="#7D6477" sub="画像版本化管理；AI 只给建议，目标、愿景与画像更新必须人工确认"
        actions={<>
          <Button size="sm" variant="outline" onClick={genReview}>发起阶段复盘（AI 建议）</Button>
          <Button size="sm" className="bg-[#7D6477] text-white" onClick={() => { setDraft({ vision: p.vision, advantages: p.advantages, tenYearGoal: p.tenYearGoal, currentGap: p.currentGap }); setEditing(!editing); }}>手动修订</Button>
        </>} />

      {editing && (
        <Section title={`手动修订（将生成 v${p.version + 1}，旧版本保留）`} accent="#7D6477">
          <div className="space-y-3">
            <Field label="愿景"><Input value={draft.vision} onChange={e => setDraft({ ...draft, vision: e.target.value })} /></Field>
            <Field label="核心优势"><Input value={draft.advantages} onChange={e => setDraft({ ...draft, advantages: e.target.value })} /></Field>
            <Field label="十年目标"><Input value={draft.tenYearGoal} onChange={e => setDraft({ ...draft, tenYearGoal: e.target.value })} /></Field>
            <Field label="现状差距"><Input value={draft.currentGap} onChange={e => setDraft({ ...draft, currentGap: e.target.value })} /></Field>
            <Button className="bg-[#7D6477] text-white" onClick={() => {
              update(d => { const cur = d.profile.current; d.profile.history.unshift(cur); d.profile.current = { ...draft, version: cur.version + 1, effectiveDate: today() }; });
              setEditing(false); toast.success('已保存为新画像版本');
            }}>确认生效新版本</Button>
          </div>
        </Section>
      )}

      {aiDraft && (
        <Section title="AI 复盘建议（逐项接受 / 拒绝；一条情绪记录不会改变愿景）" accent="#7D6477">
          <ul className="space-y-3 text-sm">
            {aiDraft.map((x, i) => (
              <li key={i} className="rounded-lg border bg-[#FAF7F2] p-3">
                <p className="text-xs text-stone-400">字段：{x.field === 'currentGap' ? '现状差距' : '核心优势'} · 旧值：{x.oldVal}</p>
                <p className="mt-1">{x.suggestion}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant={x.accepted === true ? 'default' : 'outline'} className={x.accepted === true ? 'bg-emerald-700 text-white' : ''} onClick={() => setAiDraft(aiDraft.map((y, j) => j === i ? { ...y, accepted: true } : y))}>接受</Button>
                  <Button size="sm" variant={x.accepted === false ? 'default' : 'outline'} className={x.accepted === false ? 'bg-stone-500 text-white' : ''} onClick={() => setAiDraft(aiDraft.map((y, j) => j === i ? { ...y, accepted: false } : y))}>拒绝</Button>
                </div>
              </li>
            ))}
          </ul>
          <Button className="mt-3 bg-[#7D6477] text-white" onClick={applyConfirmed}>确认所选修改</Button>
        </Section>
      )}

      <Section title={`当前画像 v${p.version}（生效 ${p.effectiveDate}）`} accent="#7D6477">
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[['愿景', p.vision], ['核心优势', p.advantages], ['十年目标', p.tenYearGoal], ['现状差距', p.currentGap]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-[#FAF7F2] p-3"><p className="text-xs text-stone-400">{k}</p><p className="mt-1">{v}</p></div>
          ))}
        </div>
      </Section>

      <Section title="历史版本（可回溯；回退也会生成新确认记录）" accent="#7D6477">
        {db.profile.history.length === 0 ? <p className="text-sm text-stone-400">暂无历史版本。</p> : (
          <ul className="space-y-2 text-sm">
            {db.profile.history.map(h => (
              <li key={h.version} className="rounded-lg border bg-white p-3">
                <p className="text-xs text-stone-400">v{h.version} · 生效 {h.effectiveDate}</p>
                <p className="mt-1">愿景：{h.vision}</p>
                <p className="text-xs text-stone-500 mt-0.5">优势：{h.advantages} · 差距：{h.currentGap}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
