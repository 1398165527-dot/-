// 共享 UI：空状态五分类、操作反馈条、板块卡、状态徽章
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type EmptyKind = 'empty' | 'filtered' | 'disabled' | 'denied' | 'error';
const EMPTY_TEXT: Record<EmptyKind, { title: string; hint: string }> = {
  empty: { title: '还没有记录', hint: '从下方按钮新建第一条' },
  filtered: { title: '没有符合条件的结果', hint: '试试放宽筛选条件' },
  disabled: { title: '该模块未启用', hint: '可在「设置与接入」中启用；历史数据不会丢失' },
  denied: { title: '暂无权限查看', hint: '该资料被标记为受限，未纳入当前可见范围' },
  error: { title: '数据暂不可用', hint: '加载失败时不显示假零值，请稍后重试' },
};
export function EmptyState({ kind, action, onAction }: { kind: EmptyKind; action?: string; onAction?: () => void }) {
  const t = EMPTY_TEXT[kind];
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg bg-white/50">
      <p className="text-sm font-medium text-stone-600">{t.title}</p>
      <p className="text-xs text-stone-400 mt-1">{t.hint}</p>
      {action && onAction && <Button size="sm" variant="outline" className="mt-3" onClick={onAction}>{action}</Button>}
    </div>
  );
}

export function Section({ title, extra, children, accent }: { title: string; extra?: ReactNode; children: ReactNode; accent?: string }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="inline-block w-2 h-4 rounded-sm" style={{ background: accent ?? '#a8a29e' }} />
            {title}
          </CardTitle>
          {extra}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  );
}

const STATUS_COLOR: Record<string, string> = {
  '计划': 'bg-sky-100 text-sky-800', '已完成': 'bg-emerald-100 text-emerald-800', '已取消': 'bg-stone-200 text-stone-500',
  '出勤': 'bg-emerald-100 text-emerald-800', '迟到': 'bg-amber-100 text-amber-800', '请假': 'bg-sky-100 text-sky-800', '缺勤': 'bg-rose-100 text-rose-800',
  '待处理': 'bg-stone-100 text-stone-700', '进行中': 'bg-sky-100 text-sky-800', '等待中': 'bg-amber-100 text-amber-800', '完成': 'bg-emerald-100 text-emerald-800', '取消': 'bg-stone-200 text-stone-500',
  '待整理': 'bg-amber-100 text-amber-800', '待确认': 'bg-orange-100 text-orange-800', '待交付': 'bg-rose-100 text-rose-800', '已交付': 'bg-emerald-100 text-emerald-800',
  '草稿': 'bg-stone-100 text-stone-600', '待核对': 'bg-orange-100 text-orange-800', '已归档': 'bg-emerald-100 text-emerald-800',
  '潜在': 'bg-stone-100 text-stone-600', '已咨询': 'bg-sky-100 text-sky-800', '已报名': 'bg-indigo-100 text-indigo-800', '服务中': 'bg-emerald-100 text-emerald-800', '暂停': 'bg-amber-100 text-amber-800', '结案': 'bg-stone-200 text-stone-600',
  '可售': 'bg-emerald-100 text-emerald-800', '停售': 'bg-stone-200 text-stone-500',
  '应收': 'bg-orange-100 text-orange-800', '收款': 'bg-emerald-100 text-emerald-800', '退款': 'bg-rose-100 text-rose-800', '支出': 'bg-stone-200 text-stone-700',
  '待分类': 'bg-violet-100 text-violet-800',
  '已冲销': 'bg-stone-200 text-stone-500 line-through', '正常': 'bg-stone-100 text-stone-700',
  '公共专业': 'bg-sky-100 text-sky-800', '老师个人': 'bg-violet-100 text-violet-800', '受限学员': 'bg-rose-100 text-rose-800',
  '收集': 'bg-stone-100 text-stone-600', '选题': 'bg-sky-100 text-sky-800', '待审': 'bg-orange-100 text-orange-800', '已发布': 'bg-emerald-100 text-emerald-800', '归档': 'bg-stone-200 text-stone-500',
};
export function StatusBadge({ s }: { s: string }) {
  return <Badge variant="secondary" className={`text-xs font-normal ${STATUS_COLOR[s] ?? 'bg-stone-100 text-stone-700'}`}>{s}</Badge>;
}

export function StatCard({ label, value, sub, onClick }: { label: string; value: string | number; sub?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-xl border bg-white p-3 shadow-sm hover:shadow transition-shadow w-full">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-2xl font-semibold mt-1 text-stone-800">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1 truncate">{sub}</p>}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-stone-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function PageHeader({ title, sub, color, actions }: { title: string; sub?: string; color: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2 text-stone-800">
          <span className="inline-block w-2.5 h-6 rounded" style={{ background: color }} />
          {title}
        </h1>
        {sub && <p className="text-xs text-stone-500 mt-1">{sub}</p>}
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}
