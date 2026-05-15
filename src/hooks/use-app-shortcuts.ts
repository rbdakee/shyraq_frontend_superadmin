import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/stores/ui-store';

export function useAppShortcuts() {
  const navigate = useNavigate();
  const openHelp = useUiStore((s) => s.openShortcutsHelp);
  const openPalette = useUiStore((s) => s.openCommandPalette);

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    openPalette();
  });
  useHotkeys('shift+/', () => openHelp());
  useHotkeys('g>h', () => navigate('/'));
  useHotkeys('g>k', () => navigate('/kindergartens'));
  useHotkeys('g>u', () => navigate('/users'));
  useHotkeys('g>o', () => navigate('/operations/billing'));
}
