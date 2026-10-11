import { useMemo, useState, type ReactElement } from 'react';
import { Toaster, toast } from 'sonner';
import { MODULE_GROUPS, MODULE_COLORS } from '@/types';
import { loadDB, useDB } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import Tasks from '@/pages/Tasks';
import Clients from '@/pages/Clients';
import Products from '@/pages/Products';
import Finance from '@/pages/Finance';
import Documents from '@/pages/Documents';
import Planning from '@/pages/Planning';
import Growth from '@/pages/Growth';
import Knowledge from '@/pages/Knowledge';
import Business from '@/pages/Business';
import Settings from '@/pages/Settings';

export type Nav = { page: string; param?: string };
const PAGES: Record<string, (nav: Nav, go: (n: Nav) => void) => ReactElement> = {
  dashboard: (_n, go) => <Dashboard go={go} />,
  schedule: (_n, go) => <Schedule go={go} />,
  tasks: () => <Tasks />,
  clients: (n, go) => <Clients focusId={n.param} go={go} />,
  products: (n, _go) => <Products focusId={n.param} />,
  finance: () => <Finance />,
  documents: () => <Documents />,
  planning: () => <Planning />,
  growth: () => <Growth />,
  knowledge: () => <Knowledge />,
  business: () => <Business />,
  settings: () => <Settings />,
};

export function useToast() { return toast; }

export default function App() {
  const [nav, setNav] = useState<Nav>({ page: 'dashboard' });
  const [db] = useDB();
  const [open, setOpen] = useState(false);
  const prefs = useMemo(() => db.modulePrefs, [db.modulePrefs]);

  const go = (n: Nav) => { setNav(n); setOpen(false); window.scrollTo({ top: 0 }); };

  const sidebar = (
    <nav className="h-full flex flex-col">
      <div className="px-4 py-4 border-b">
        <p className="font-bold text-stone-800">学习力工作台</p>
        <p className="text-[11px] text-stone-400 mt-0.5">验证版 · 数据仅存本浏览器</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {MODULE_GROUPS.map(g => {
          const visible = g.items.filter(it => {
            const p = prefs.find(x => x.key === it.key);
            return p && p.enabled && !p.hidden;
          });
          if (visible.length === 0) return null;
          return (
            <div key={g.group} className="mt-2">
              <p className="px-4 text-[11px] font-medium" style={{ color: g.color }}>{g.group}</p>
              {visible.map(it => (
                <button key={it.key} onClick={() => go({ page: it.key })}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${nav.page === it.key ? 'bg-white font-medium text-stone-900 border-r-2' : 'text-stone-500 hover:text-stone-800'}`}
                  style={nav.page === it.key ? { borderColor: MODULE_COLORS[it.key] } : undefined}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODULE_COLORS[it.key] }} />
                  {it.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t text-[11px] text-stone-400">
        示例数据均为虚构 · AI 建议需人工确认
      </div>
    </nav>
  );

  const hiddenTip = (key: string) => {
    const p = prefs.find(x => x.key === key);
    if (p && (!p.enabled || p.hidden)) {
      return (
        <div className="p-10 text-center">
          <p className="text-stone-600 font-medium">该模块已{!p.enabled ? '停用' : '隐藏'}</p>
          <p className="text-sm text-stone-400 mt-1">隐藏不删除历史数据，可在「设置与接入」中重新显示。</p>
          <Button variant="outline" className="mt-4" onClick={() => go({ page: 'settings' })}>前往设置</Button>
        </div>
      );
    }
    return null;
  };

  void loadDB();
  const body = hiddenTip(nav.page) ?? PAGES[nav.page]?.(nav, go) ?? null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-800">
      <Toaster richColors position="top-center" />
      {/* 移动端顶栏 */}
      <div className="lg:hidden sticky top-0 z-20 bg-[#FAF7F2]/95 backdrop-blur border-b px-3 py-2 flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="菜单"><Menu className="w-4 h-4" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#F4EFE7]">{sidebar}</SheetContent>
        </Sheet>
        <p className="font-semibold text-sm">学习力工作台</p>
      </div>
      <div className="flex">
        <aside className="hidden lg:block w-56 shrink-0 border-r bg-[#F4EFE7] min-h-screen sticky top-0 h-screen">{sidebar}</aside>
        <main className="flex-1 px-3 sm:px-5 lg:px-8 py-4 max-w-6xl w-full mx-auto">{body}</main>
      </div>
    </div>
  );
}
