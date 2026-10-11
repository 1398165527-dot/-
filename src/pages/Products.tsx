// P05 产品管理 + P06 报名（快照锁定，改价不影响旧报名）
import { useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today, createEnrollment } from '@/lib/store';
import { PageHeader, Section, StatusBadge, EmptyState, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProductForm, DeductRule } from '@/types';

export default function Products({ focusId }: { focusId?: string }) {
  const [db, update] = useDB();
  const [creating, setCreating] = useState(false);
  const [enrollFor, setEnrollFor] = useState<string | null>(focusId ?? null);
  const [form, setForm] = useState({ name: '', form: '一对一' as ProductForm, price: '', unit: '课时', deductRule: '不自动核销' as DeductRule, refundRule: '', plannedCount: '' });

  const createProduct = () => {
    if (!form.name.trim()) { toast.error('请填写产品名称'); return; }
    if (!form.refundRule.trim()) { toast.error('正式可售需规则明确：请填写退费规则（否则仅保存草稿）'); return; }
    update(d => d.products.unshift({
      id: uid(), name: form.name.trim(), form: form.form, version: 1,
      price: Number(form.price) || 0, unit: form.unit, deductRule: form.deductRule,
      refundRule: form.refundRule, plannedCount: Number(form.plannedCount) || undefined,
      status: '可售', createdAt: today(),
    }));
    setCreating(false); setForm({ name: '', form: '一对一', price: '', unit: '课时', deductRule: '不自动核销', refundRule: '', plannedCount: '' });
    toast.success('产品已发布 v1');
  };

  return (
    <div>
      <PageHeader title="产品与报名" color="#42546A" sub="产品版本化管理；报名保存快照，改价不影响旧约定"
        actions={<Button size="sm" className="bg-[#42546A] text-white" onClick={() => setCreating(!creating)}>设计产品</Button>} />

      {creating && (
        <Section title="新产品" accent="#42546A">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="名称"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="形式">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.form} onChange={e => setForm({ ...form, form: e.target.value as ProductForm })}>
                {['一对一', '小班', '大班', '陪跑'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="价格（元）"><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="计价单位"><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="课时/次/期" /></Field>
            <Field label="核销规则（未配置不自动扣课）">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.deductRule} onChange={e => setForm({ ...form, deductRule: e.target.value as DeductRule })}>
                {['签到核销', '服务完成核销', '不自动核销'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="计划次数（如 12 次）"><Input type="number" value={form.plannedCount} onChange={e => setForm({ ...form, plannedCount: e.target.value })} /></Field>
          </div>
          <Field label="退费规则（可售必填；无可靠收费参考时标「待补」，不编造行情）">
            <Input value={form.refundRule} onChange={e => setForm({ ...form, refundRule: e.target.value })} placeholder="如：已上课时按单价扣除后退还余额" />
          </Field>
          <Button className="mt-3 bg-[#42546A] text-white" onClick={createProduct}>发布 v1</Button>
        </Section>
      )}

      <div className="grid gap-3">
        {db.products.length === 0 && <EmptyState kind="empty" />}
        {db.products.map(p => {
          const ens = db.enrollments.filter(e => e.productId === p.id);
          return (
            <Section key={p.id} title={p.name} accent="#42546A"
              extra={<div className="flex gap-1 items-center"><span className="text-xs text-stone-400">v{p.version}</span><StatusBadge s={p.status} /></div>}>
              <p className="text-sm text-stone-600">¥{p.price} / {p.unit} · {p.form}{p.plannedCount ? ` · 计划${p.plannedCount}次` : ''} · {p.deductRule}</p>
              <p className="text-xs text-stone-400 mt-1">退费规则：{p.refundRule}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => {
                  update(d => {
                    const np = d.products.find(x => x.id === p.id)!;
                    const priceStr = window.prompt(`「${p.name}」当前价 ¥${p.price}。输入新价格将发布 v${p.version + 1}（旧报名快照不受影响）`, String(p.price));
                    if (priceStr === null) return;
                    np.price = Number(priceStr) || np.price;
                    np.version += 1;
                  });
                  toast.success('已发布新版本；历史报名的快照价格与退费规则保持不变');
                }}>改价发新版</Button>
                <Button size="sm" variant="outline" onClick={() => setEnrollFor(enrollFor === p.id ? null : p.id)}>报名（{ens.length}）</Button>
                {p.deductRule === '不自动核销' && <span className="text-[11px] text-amber-700 self-center">该产品不会自动扣课</span>}
              </div>
              {enrollFor === p.id && (
                <div className="mt-3 rounded-lg border bg-[#FAF7F2] p-3">
                  <p className="text-xs text-stone-500 mb-2">选择学员创建报名：将锁定当前 v{p.version} 快照（产品、价格、权益、退费规则）并生成应收与权益。</p>
                  <div className="flex flex-wrap gap-2">
                    {db.students.filter(s => s.stage !== '结案').map(s => (
                      <Button key={s.id} size="sm" variant="outline" onClick={() => {
                        update(d => { const msg = createEnrollment(d, s.id, p.id); toast.success(msg); });
                        setEnrollFor(null);
                      }}>{s.name} <StatusBadge s={s.stage} /></Button>
                    ))}
                  </div>
                  {ens.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-stone-500">
                      {ens.map(e => {
                        const stu = db.students.find(s => s.id === e.studentId);
                        return <li key={e.id}>{stu?.name} · {e.startDate} 报名 · 快照 v{e.snapshot.version}（¥{e.snapshot.price}）· <StatusBadge s={e.status} /></li>;
                      })}
                    </ul>
                  )}
                </div>
              )}
            </Section>
          );
        })}
      </div>
    </div>
  );
}
