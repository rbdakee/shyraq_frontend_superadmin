import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, AlertTriangle, Building2, CalendarPlus, FileText, Receipt } from 'lucide-react';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useUiStore } from '@/stores/ui-store';
import { useDebounce } from '@/hooks/use-debounce';
import { useKindergartens } from '@/hooks/use-kindergartens';

interface OpItem {
  labelKey: string;
  path: string;
  icon: React.ElementType;
}

const OPS_ITEMS: OpItem[] = [
  {
    labelKey: 'command_palette.ops.open_dlq',
    path: '/operations/lifecycle-dlq',
    icon: AlertTriangle,
  },
  { labelKey: 'command_palette.ops.monthly_billing', path: '/operations/billing', icon: Receipt },
  { labelKey: 'command_palette.ops.content', path: '/operations/content', icon: FileText },
  {
    labelKey: 'command_palette.ops.rollout',
    path: '/operations/schedule-rollout',
    icon: CalendarPlus,
  },
  { labelKey: 'command_palette.ops.system_status', path: '/system-status', icon: Activity },
];

export function CommandPalette() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const closeCommandPalette = useUiStore((s) => s.closeCommandPalette);

  const [q, setQ] = useState('');
  const qDebounced = useDebounce(q, 250);

  const shouldSearchKg = qDebounced.length >= 2;

  const {
    data: kgData,
    isLoading: kgLoading,
    isError: kgError,
  } = useKindergartens({
    name_search: shouldSearchKg ? qDebounced : undefined,
    limit: 5,
  });

  const kgItems = kgData?.items ?? [];

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeCommandPalette();
      setQ('');
    }
  }

  function handleSelect(path: string) {
    closeCommandPalette();
    setQ('');
    navigate(path);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('command_palette.placeholder')}
      description={t('command_palette.placeholder')}
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder={t('command_palette.placeholder')}
          value={q}
          onValueChange={setQ}
        />
        <CommandList>
          {shouldSearchKg && (
            <>
              <CommandGroup heading={t('command_palette.section_kindergartens')}>
                {kgLoading && (
                  <>
                    <CommandItem disabled>{t('command_palette.loading')}</CommandItem>
                    <CommandItem disabled>{t('command_palette.loading')}</CommandItem>
                    <CommandItem disabled>{t('command_palette.loading')}</CommandItem>
                  </>
                )}
                {kgError && <CommandItem disabled>{t('command_palette.empty')}</CommandItem>}
                {!kgLoading &&
                  !kgError &&
                  kgItems.map((kg) => (
                    <CommandItem
                      key={kg.id}
                      value={`kg-${kg.id}`}
                      onSelect={() => handleSelect(`/kindergartens/${kg.id}`)}
                    >
                      <Building2 className="size-4 shrink-0 opacity-70" />
                      <span>{kg.name}</span>
                    </CommandItem>
                  ))}
                {!kgLoading && !kgError && kgItems.length === 0 && (
                  <CommandItem disabled>{t('command_palette.empty')}</CommandItem>
                )}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          <CommandGroup heading={t('command_palette.section_operations')}>
            {OPS_ITEMS.map((op) => {
              const Icon = op.icon;
              return (
                <CommandItem
                  key={op.path}
                  value={`op-${op.path}`}
                  onSelect={() => handleSelect(op.path)}
                >
                  <Icon className="size-4 shrink-0 opacity-70" />
                  <span>{t(op.labelKey)}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          {shouldSearchKg && !kgLoading && kgItems.length === 0 && (
            <CommandEmpty>{t('command_palette.empty')}</CommandEmpty>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
