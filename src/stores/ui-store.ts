import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'ru' | 'kk';

interface UiState {
  sidebarCollapsed: boolean;
  locale: Locale;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setLocale: (l: Locale) => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  shortcutsHelpOpen: boolean;
  openShortcutsHelp: () => void;
  closeShortcutsHelp: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      locale: 'ru',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setLocale: (locale) => set({ locale }),
      commandPaletteOpen: false,
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      shortcutsHelpOpen: false,
      openShortcutsHelp: () => set({ shortcutsHelpOpen: true }),
      closeShortcutsHelp: () => set({ shortcutsHelpOpen: false }),
    }),
    { name: 'shyraq.sa.ui' },
  ),
);
