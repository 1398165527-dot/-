// P13 文档中心：三层信息统一视图（原件在哪里 / 工作台保存什么 / AI 可使用什么）
import { useState } from 'react';
import { toast } from 'sonner';
import { useDB, uid, today } from '@/lib/store';
import { PageHeader, Section, EmptyState, Field } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Documents() {
  const [db, update] = useDB();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', storageType: '老师电脑本地', location: '', summary: '', aiScope: '仅摘要可供 AI 使用' });

  return (
    <div>
      <PageHeader title="合同与文档索引" color="#42546A" sub="原件不默认上传工作台；工作台只保存索引与约定摘要；不为索引收集身份证号"
        actions={<Button size="sm" className="bg-[#42546A] text-white" onClick={() => setAdding(!adding)}>登记文档</Button>} />

      {adding && (
        <Section title="登记文档位置（登记 ≠ 上传）" accent="#42546A">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="标题"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="存放类型">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.storageType} onChange={e => setForm({ ...form, storageType: e.target.value })}>
                {['老师电脑本地', '云文档', '工作台存储'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="位置（路径或链接）"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="如 D:\合同\xxx.pdf 或文档链接" /></Field>
            <Field label="AI 可使用范围">
              <select className="w-full border rounded-md h-9 px-2 text-sm bg-white" value={form.aiScope} onChange={e => setForm({ ...form, aiScope: e.target.value })}>
                {['不供 AI 使用', '仅摘要可供 AI 使用', '全文可供 AI 使用'].map(x => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label="工作台保存的摘要（老师确认的约定摘要）"><Input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></Field></div>
          </div>
          <Button className="mt-3 bg-[#42546A] text-white" onClick={() => {
            if (!form.title.trim() || !form.location.trim()) { toast.error('请填写标题与位置'); return; }
            update(d => d.docRefs.unshift({ id: uid(), title: form.title, storageType: form.storageType as '老师电脑本地', location: form.location, summary: form.summary, aiScope: form.aiScope, valid: true, createdAt: today() }));
            setAdding(false); setForm({ title: '', storageType: '老师电脑本地', location: '', summary: '', aiScope: '仅摘要可供 AI 使用' });
            toast.success('已登记索引（未上传原件）');
          }}>保存索引</Button>
        </Section>
      )}

      {db.docRefs.length === 0 ? <EmptyState kind="empty" /> : (
        <div className="space-y-2">
          {db.docRefs.map(doc => {
            const stu = doc.studentId ? db.students.find(s => s.id === doc.studentId) : null;
            return (
              <div key={doc.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-sm">{doc.title} {stu && <span className="text-xs text-stone-400">· {stu.name}</span>}</p>
                  <span className="text-[10px] text-stone-400">{doc.storageType} · 登记于 {doc.createdAt}</span>
                </div>
                <div className="mt-2 grid sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-[#FAF7F2] p-2">
                    <p className="text-stone-400 mb-0.5">① 原件在哪里</p>
                    <p className="break-all">{doc.location}</p>
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] px-1.5" onClick={() => { navigator.clipboard?.writeText(doc.location); toast.success('路径已复制，可在文件管理器手动定位'); }}>复制位置</Button>
                      {doc.storageType === '老师电脑本地' && <span className="text-[10px] text-amber-700 self-center">网页不能直接打开本地文件，不假装已读取</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#FAF7F2] p-2"><p className="text-stone-400 mb-0.5">② 工作台保存了什么</p><p>{doc.summary || '（未填摘要）'}</p></div>
                  <div className="rounded-lg bg-[#FAF7F2] p-2"><p className="text-stone-400 mb-0.5">③ AI 可使用什么</p><p>{doc.aiScope}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
