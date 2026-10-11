// P21 内容与情报 + P22 商务合作（采集持续更新是明确需求；无指标不标验证爆款；外发需确认）
import { toast } from 'sonner';
import { useDB } from '@/lib/store';
import { PageHeader, Section, StatusBadge } from '@/components/shared';
import { Button } from '@/components/ui/button';

export default function Business() {
  const [db, update] = useDB();
  const FLOW = ['收集', '选题', '草稿', '待审', '已发布', '归档'];

  return (
    <div>
      <PageHeader title="经营与内容情报" color="#6B7BB4" sub="爆款采集与持续更新为明确需求（全栈版由后台调度执行）；AI 生成只能进草稿/待审，外发必须确认" />

      <Section title="内容情报（保存来源、发布/采集时间与指标口径）" accent="#6B7BB4"
        extra={<Button size="sm" variant="outline" onClick={() => toast.info('验证版为手工采集入口；后台持续采集需全栈版调度（Cloudflare Workers 定时任务，W01 验证项）')}>采集状态</Button>}>
        <div className="space-y-2">
          {db.contents.map(c => (
            <div key={c.id} className="rounded-xl border bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-medium">{c.title}</p>
                <div className="flex gap-1 items-center">
                  <StatusBadge s={c.status} />
                  {c.verified
                    ? <span className="text-[10px] rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5">已验证爆款</span>
                    : <span className="text-[10px] rounded bg-stone-100 text-stone-500 px-1.5 py-0.5">无指标·不标爆款</span>}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                {c.platform}{c.author ? ` · ${c.author}` : ''}{c.publishedAt ? ` · 发布 ${c.publishedAt}` : ''} · 采集 {c.collectedAt}{c.metrics ? ` · ${c.metrics}` : ''}
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {FLOW.map(s => (
                  <Button key={s} size="sm" variant="outline" className={`h-6 text-[10px] px-1.5 ${c.status === s ? 'border-[#6B7BB4] text-[#6B7BB4]' : ''}`}
                    onClick={() => {
                      if (s === '已发布' && !window.confirm('外发确认：AI 生成内容只能到草稿/待审，发布必须由老师确认。确认已核对内容并同意发布？')) return;
                      update(d => { d.contents.find(x => x.id === c.id)!.status = s as typeof c.status; });
                      toast.success(`状态 → ${s}`);
                    }}>{s}</Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">区分「采集失败」与「没有新内容」；部分失败保留成功项；不同时间指标保留采样时间，不做跨平台等价比较。</p>
      </Section>

      <Section title="商务与机构合作" accent="#6B7BB4">
        <div className="space-y-2">
          {db.cooperations.map(c => (
            <div key={c.id} className="rounded-xl border bg-white p-3 text-sm flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="font-medium">{c.org} <span className="text-xs text-stone-400 font-normal">· {c.purpose}</span></p>
                {c.nextStep && <p className="text-[11px] text-amber-700 mt-0.5">下一步：{c.nextStep}</p>}
              </div>
              <select className="border rounded-md h-8 px-2 text-xs bg-white" value={c.status}
                onChange={e => update(d => { d.cooperations.find(x => x.id === c.id)!.status = e.target.value as typeof c.status; })}>
                {['交流中', '合作中', '已结束'].map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">交流可转合作项目并产生任务与线索；合作承诺不由 AI 捏造。</p>
      </Section>
    </div>
  );
}
