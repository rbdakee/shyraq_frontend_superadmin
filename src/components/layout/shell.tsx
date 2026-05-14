import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/cn';

export function Shell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-[margin] duration-200',
          collapsed ? 'ml-16' : 'ml-60',
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
