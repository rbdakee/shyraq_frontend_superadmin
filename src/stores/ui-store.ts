import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'ru' | 'kk';

interface UiState {
  sidebarCollapsed: boolean;
  locale: Locale;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setLocale: (l: Locale) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      locale: 'ru',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'shyraq.sa.ui' },
  ),
);
