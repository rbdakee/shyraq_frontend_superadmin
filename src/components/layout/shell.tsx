import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { RouteSkeleton } from './route-skeleton';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/cn';
import { useAppShortcuts } from '@/hooks/use-app-shortcuts';
import { ShortcutsHelpModal } from './shortcuts-help-modal';

export function Shell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  useAppShortcuts();

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
          <Suspense fallback={<RouteSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <CommandPalette />
      <ShortcutsHelpModal />
    </div>
  );
}
