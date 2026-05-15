import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores/ui-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  );
}

interface ShortcutRow {
  keys: string[];
  label: string;
}

export function ShortcutsHelpModal() {
  const { t } = useTranslation('common');
  const shortcutsHelpOpen = useUiStore((s) => s.shortcutsHelpOpen);
  const closeShortcutsHelp = useUiStore((s) => s.closeShortcutsHelp);

  const rows: ShortcutRow[] = [
    { keys: ['Cmd/Ctrl+K'], label: t('shortcuts.help.kbd_cmd_k') },
    { keys: ['Esc'], label: t('shortcuts.help.kbd_esc') },
    { keys: ['?'], label: t('shortcuts.help.kbd_question') },
    { keys: ['g', 'h'], label: t('shortcuts.help.kbd_g_h') },
    { keys: ['g', 'k'], label: t('shortcuts.help.kbd_g_k') },
    { keys: ['g', 'u'], label: t('shortcuts.help.kbd_g_u') },
    { keys: ['g', 'o'], label: t('shortcuts.help.kbd_g_o') },
  ];

  return (
    <Dialog open={shortcutsHelpOpen} onOpenChange={(o) => !o && closeShortcutsHelp()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shortcuts.help.title')}</DialogTitle>
        </DialogHeader>
        <dl className="mt-2 space-y-2">
          {rows.map((row) => (
            <div key={row.keys.join('+')} className="flex items-center justify-between gap-4">
              <dd className="text-sm text-muted-foreground">{row.label}</dd>
              <dt className="flex shrink-0 items-center gap-1">
                {row.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dt>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
