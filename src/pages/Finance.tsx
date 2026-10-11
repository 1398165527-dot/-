// P12 财务总览与收支详情（金额以分存储，冲销不覆盖；收款 ≠ 服务完成）
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today, fmtMoney, reverseFinance } from '@/lib/store';
import { PageHeader, Section, StatusBadge, StatCard, EmptyState, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FinKind } from '@/types';

export default function Finance() {
  const [db, update] = useDB();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ kind: '收款' as FinKind, amount: '', payer: '', note: '', enrollmentId: '' });

  const active = db.finances.filter(f => f.status === '正常');
  const sum = (k: FinKind) => active.filter(f => f.kind === k).reduce((s, f) => s + f.amountCents, 0);
  const received = sum('收款') - sum('退款');
  const receivable = sum('应收') - sum('收款');
  const rows = useMemo(() => [...db.finances].sort((a, b) => b.date.localeCompare(a.date)), [db.finances]);

  return (
    <div>
      <PageHeader title="财务" color="#4A3934" sub="应收/实收/退款/支出独立记录；金额定点计算；AI 不能改已确认账；更正以冲销方式"
        actions={<Button size="sm" className="bg-[#4A3934] text-white" onClick={() => setAdding(!adding)}>人工登记</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="未收余额（应收-收款）" value={`¥${fmtMoney(receivable)}`} sub="口径说明：不含退款" />
        <StatCard label="实收（收款-退款）" value={`¥${fmtMoney(received)}`} sub="收款 ≠ 服务完成" />
        <StatCard label="退款合计" value={`¥${fmtMoney(sum('退款'))}`} />
        <StatCard label="支出合计" value={`¥${fmtMoney(sum('支出'))}`} />
      </div>

      {adding && (
        <Section title="登记收支（不对接支付也能用）" accent="#4A3934">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="类型">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as FinKind })}>
                {(['应收', '收款', '退款', '支出'] as FinKind[]).map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="金额（元）"><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="付款人/对象"><Input value={form.payer} onChange={e => setForm({ ...form, payer: e.target.value })} /></Field>
            <Field label="关联报名（可选）">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.enrollmentId} onChange={e => setForm({ ...form, enrollmentId: e.target.value })}>
                <option value="">不关联</option>
                {db.enrollments.map(e => {
                  const s = db.students.find(x => x.id === e.studentId);
                  return <option key={e.id} value={e.id}>{s?.name} · {e.snapshot.productName}</option>;
                })}
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="备注"><Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="如：分期第2期" /></Field></div>
          </div>
          <Button className="mt-3 bg-[#4A3934] text-white" onClick={() => {
            const amt = Number(form.amount);
            if (!amt || amt <= 0) { toast.error('请输入有效金额'); return; }
            update(d => d.finances.push({ id: uid(), kind: form.kind, amountCents: Math.round(amt * 100), currency: 'CNY', date: today(), enrollmentId: form.enrollmentId || undefined, payer: form.payer || undefined, note: form.note || form.kind, status: '正常', createdAt: today() }));
            setForm({ kind: '收款', amount: '', payer: '', note: '', enrollmentId: '' });
            toast.success('已登记（独立日期记录）');
          }}>保存</Button>
        </Section>
      )}

      <Section title="收支明细" accent="#4A3934">
        {rows.length === 0 ? <EmptyState kind="empty" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="text-left text-xs text-stone-400"><th className="py-1.5">日期</th><th>类型</th><th className="text-right">金额</th><th>对象/说明</th><th>状态</th><th></th></tr></thead>
              <tbody>
                {rows.map(f => {
                  const en = f.enrollmentId ? db.enrollments.find(e => e.id === f.enrollmentId) : null;
                  const stu = en ? db.students.find(s => s.id === en.studentId) : null;
                  return (
                    <tr key={f.id} className={`border-t border-stone-100 ${f.status === '已冲销' ? 'opacity-50' : ''}`}>
                      <td className="py-1.5">{f.date}</td>
                      <td><StatusBadge s={f.kind} /></td>
                      <td className={`text-right font-mono ${f.amountCents < 0 ? 'text-rose-700' : ''}`}>¥{fmtMoney(f.amountCents)}</td>
                      <td className="text-stone-600">{[f.payer, stu?.name, f.note].filter(Boolean).join(' · ')}</td>
                      <td><StatusBadge s={f.status} /></td>
                      <td className="text-right">
                        {f.status === '正常' && f.amountCents > 0 && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                            const reason = window.prompt('冲销原因（原记录保留，生成反向记录）');
                            if (reason === null) return;
                            update(d => { const msg = reverseFinance(d, f.id, reason || '更正'); toast.success(msg); });
                          }}>冲销</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-stone-400 mt-3">导出（含字段说明）将在全栈版提供；本验证版数据存于浏览器。</p>
      </Section>
    </div>
  );
}
