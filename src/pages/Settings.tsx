// P23 设置与模块管理 + P24 接入运行 + P25 用量成本 + Skill 中心
// v0.4：P00 接入能力真实状态矩阵（数据驱动）、P02 规则版本、P01 数据边界
import { toast } from 'sonner';
import { useDB, resetDB } from '@/lib/store';
import { PageHeader, Section } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { MODULE_GROUPS } from '@/types';
import type { ProviderState } from '@/types';

const SKILLS = [
  { id: 'S1', name: '四象限判断与提醒规则引导', desc: '用老师真实例子形成重要性/紧急性个人规则；到期提醒与重要性分开' },
  { id: 'S2', name: '模块使用需求与反馈引导', desc: '决定各模块启用/隐藏，后台任务单独选择' },
  { id: 'S3', name: '咨询记录整理与归档', desc: '文字/手写识别/录音转写整理为归档文档，待核对不虚构' },
  { id: 'S4', name: '阶段复盘与个人画像更新', desc: 'AI 草稿 + 逐项人工确认后更新画像版本' },
];

// P00：状态颜色如实区分；没有调用证据不显示「验证通过」
const STATE_COLOR: Record<ProviderState, string> = {
  '验证通过': 'bg-emerald-100 text-emerald-800',
  '已配置': 'bg-sky-100 text-sky-800',
  '仅链接': 'bg-stone-100 text-stone-600',
  '受限': 'bg-amber-100 text-amber-800',
  '失败': 'bg-rose-100 text-rose-800',
};

export default function Settings() {
  const [db, update] = useDB();

  return (
    <div>
      <PageHeader title="设置与接入" color="#A86F59" sub="模块隐藏不删除数据；接入状态如实显示，不伪装已开通；凭据不出现在页面" />

      <Section title="Skill 中心（可复制到国内 AI 使用的中文引导文档）" accent="#A86F59">
        <div className="grid sm:grid-cols-2 gap-2">
          {SKILLS.map(s => (
            <div key={s.id} className="rounded-lg border bg-white p-3 text-sm">
              <p className="font-medium">{s.id} {s.name}</p>
              <p className="text-xs text-stone-500 mt-1">{s.desc}</p>
              <p className="text-[11px] text-stone-400 mt-1">文档形式交付，不依赖程序自动导入；输出经老师确认后形成配置新版本。</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="模块管理（启用 / 显示；后台任务另选）" accent="#A86F59">
        <div className="space-y-3">
          {MODULE_GROUPS.map(g => (
            <div key={g.group}>
              <p className="text-xs font-medium mb-1.5" style={{ color: g.color }}>{g.group}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {g.items.map(it => {
                  const p = db.modulePrefs.find(x => x.key === it.key)!;
                  return (
                    <div key={it.key} className="rounded-lg border bg-white p-2.5 text-sm flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-[13px]">{it.label}</p>
                        <p className="text-[10px] text-stone-400">{it.desc}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <label className="flex items-center gap-1 text-[10px] text-stone-500">
                          <input type="checkbox" className="w-3 h-3" checked={p.enabled} disabled={it.key === 'settings'}
                            onChange={e => { update(d => { d.modulePrefs.find(x => x.key === it.key)!.enabled = e.target.checked; }); toast.success(e.target.checked ? '已启用' : '已停用（数据保留）'); }} />启用
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-stone-500">
                          <input type="checkbox" className="w-3 h-3" checked={!p.hidden} disabled={!p.enabled || it.key === 'settings'}
                            onChange={e => { update(d => { d.modulePrefs.find(x => x.key === it.key)!.hidden = !e.target.checked; }); toast.success(e.target.checked ? '已显示' : '已隐藏入口（历史数据保留，后台任务默认继续）'); }} />显示
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">隐藏 ≠ 删除；隐藏采集类界面时是否暂停后台任务需单独选择（全栈版提供）；需要依赖模块时系统会解释原因并提供替代入口。</p>
      </Section>

      <Section title="接入与运行状态（P00 真实状态矩阵）" accent="#A86F59">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-stone-400"><th className="py-1">服务方</th><th>能力</th><th>状态</th><th>验证时间/证据</th><th>降级方案</th></tr></thead>
          <tbody>
            {db.providerCaps.map(p => (
              <tr key={p.id} className="border-t border-stone-100 align-top">
                <td className="py-2 font-medium text-[13px] pr-2">{p.provider}</td>
                <td className="pr-2 text-[12px]">{p.capability}</td>
                <td className="pr-2"><span className={`text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap ${STATE_COLOR[p.state]}`}>{p.state}</span></td>
                <td className="pr-2 text-[11px] text-stone-500">
                  {p.verifiedAt ? `${p.verifiedAt} · ${p.evidence ?? ''}` : (p.lastError ? `最近问题：${p.lastError}` : '—')}
                </td>
                <td className="text-[11px] text-stone-500">{p.fallback ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-stone-400 mt-2">口径：凭据只配置在部署密钥中，不出现在页面/日志/AI输入；接口权限未验证不标「验证通过」。企业微信会话内容接口文档与权限待复核；Notion 需逐页授权且境外服务不放受限学员资料。</p>
      </Section>

      <Section title="规则与 Skill 版本（P02：未确认规则不自动生效）" accent="#A86F59">
        <div className="space-y-2">
          {db.rules.map(r => (
            <div key={r.id} className="rounded-lg border bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-[13px]">{r.ruleType} <span className="text-stone-400 font-normal">v{r.version}</span></p>
                <span className={`text-[10px] rounded px-1.5 py-0.5 ${r.status === '已确认' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {r.status}{r.confirmedAt ? ` · ${r.confirmedAt}` : ''}
                </span>
              </div>
              <p className="text-[12px] text-stone-600 mt-1">{r.content}</p>
              {r.examples && <p className="text-[11px] text-stone-400 mt-1">例子：{r.examples}</p>}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-2">草稿状态的规则仅作参考，不自动分级/外发；修改须经老师确认后生成新版本，历史版本保留。</p>
      </Section>

      <Section title="用量与成本（估算 ≠ 账单；未知单价标「待报价」）" accent="#4A3934">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-stone-400"><th className="py-1">周期</th><th>AI 调用</th><th>复盘</th><th>转写(分钟)</th><th>图片</th><th>存储</th><th>估算费用</th></tr></thead>
          <tbody>
            {db.usage.map(u => (
              <tr key={u.month} className="border-t border-stone-100">
                <td className="py-1.5">{u.month}</td><td>{u.aiCalls}</td><td>{u.reviewCount}</td><td>{u.transcribeMin}</td><td>{u.images}</td><td>{u.storageMB}MB</td>
                <td className="text-amber-700">待报价</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-stone-400 mt-2">公式：模型成本=Σ(输入token/计价单位×输入单价 + 输出token/计价单位×输出单价)；转写=分钟×单价。不沿用「2000元/月」作为确定成本。</p>
      </Section>

      <Section title="数据管理" accent="#A86F59">
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant="outline" onClick={() => {
            const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `学习力工作台_数据导出_${new Date().toISOString().slice(0, 10)}.json`; a.click();
            toast.success('已导出结构记录与配置（本地原件不在导出内，仅含索引）');
          }}>导出数据（JSON）</Button>
          <Button size="sm" variant="outline" className="text-rose-700 border-rose-200" onClick={() => {
            if (window.confirm('将清空当前浏览器内的全部改动并恢复虚构示例数据，确认？')) { resetDB(); location.reload(); }
          }}>重置为示例数据</Button>
          <p className="text-[11px] text-stone-400">P01 数据边界：验证版数据仅保存在本浏览器 localStorage，<b>不可承载关键业务数据</b>；清除浏览器数据会丢失，不跨设备同步。迁移到数据库的路径：备份导出 → 盘点 → 映射查重预览 → 小批导入 → 关联核对 → 双设备测试 → 停止旧写入。旧版本地数据打开本版会自动补齐新集合，不丢原有数据。</p>
        </div>
      </Section>
    </div>
  );
}
