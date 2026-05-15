import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calendar as CalIcon, Cake, Trash2, Send } from 'lucide-react';
import { format, endOfDay } from 'date-fns';

import { PageHeader } from '@/components/layout/page-header';
import { TriggerCard } from '@/components/operations/trigger-card';
import { TriggerResult } from '@/components/operations/trigger-result';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  useBirthdayRun,
  useStoryCleanupRun,
  usePublishScheduledRun,
} from '@/hooks/use-content-ops';
import { useOperationsStore } from '@/stores/operations-store';

interface ContentRunResult {
  triggered_at: string;
  processed_count: number;
  skipped_count: number;
  kindergartens_processed?: number;
}

export default function OperationsContentPage() {
  const { t } = useTranslation(['operations']);

  const [birthdayNow, setBirthdayNow] = useState<Date | undefined>(undefined);
  const [storyNow, setStoryNow] = useState<Date | undefined>(undefined);
  const [publishNow, setPublishNow] = useState<Date | undefined>(undefined);

  const birthdayMut = useBirthdayRun();
  const storyMut = useStoryCleanupRun();
  const publishMut = usePublishScheduledRun();

  const birthdayResult = useOperationsStore((s) => s.results['content.birthday']);
  const storyResult = useOperationsStore((s) => s.results['content.story_cleanup']);
  const publishResult = useOperationsStore((s) => s.results['content.publish_scheduled']);

  const handleBirthday = async () => {
    try {
      const result = await birthdayMut.mutateAsync({
        now: birthdayNow ? endOfDay(birthdayNow).toISOString() : undefined,
      });
      useOperationsStore.getState().setResult('content.birthday', result);
      toast.success(t('operations:content.birthday.processed', { count: result.processed_count }));
    } catch {
      toast.error(t('operations:content.toast_error'));
    }
  };

  const handleStory = async () => {
    try {
      const result = await storyMut.mutateAsync({
        now: storyNow ? endOfDay(storyNow).toISOString() : undefined,
      });
      useOperationsStore.getState().setResult('content.story_cleanup', result);
      toast.success(
        t('operations:content.story_cleanup.processed', { count: result.processed_count }),
      );
    } catch {
      toast.error(t('operations:content.toast_error'));
    }
  };

  const handlePublish = async () => {
    try {
      const result = await publishMut.mutateAsync({
        now: publishNow ? endOfDay(publishNow).toISOString() : undefined,
      });
      useOperationsStore.getState().setResult('content.publish_scheduled', result);
      toast.success(
        t('operations:content.publish_scheduled.processed', { count: result.processed_count }),
      );
    } catch {
      toast.error(t('operations:content.toast_error'));
    }
  };

  const buildContentRows = (
    result: ContentRunResult,
    ns: 'birthday' | 'story_cleanup' | 'publish_scheduled',
  ) => [
    {
      label: t(`operations:content.${ns}.processed_label`),
      value: result.processed_count,
    },
    {
      label: t(`operations:content.${ns}.skipped_label`),
      value: result.skipped_count,
    },
    {
      label: t(`operations:content.${ns}.kgs_label`),
      value: result.kindergartens_processed ?? 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('operations:content.page_title')}
        subtitle={t('operations:content.page_subtitle')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Birthday Posts Generation */}
        <TriggerCard
          title={t('operations:content.birthday.title')}
          icon={<Cake className="size-5" />}
          description={t('operations:content.birthday.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:content.birthday.now_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {birthdayNow
                      ? format(birthdayNow, 'yyyy-MM-dd')
                      : t('operations:content.birthday.now_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={birthdayNow} onSelect={setBirthdayNow} />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:content.birthday.now_hint')}
              </p>
            </div>
          }
          onTrigger={handleBirthday}
          triggerLabel={t('operations:content.birthday.trigger')}
          triggerPendingLabel="..."
          isPending={birthdayMut.isPending}
          result={
            birthdayResult ? (
              <TriggerResult
                ts={birthdayResult.ts}
                variant="sync-counters"
                title={t('operations:content.birthday.result_label')}
                rows={buildContentRows(birthdayResult.result as ContentRunResult, 'birthday')}
              />
            ) : undefined
          }
        />

        {/* Story Cleanup */}
        <TriggerCard
          title={t('operations:content.story_cleanup.title')}
          icon={<Trash2 className="size-5" />}
          description={t('operations:content.story_cleanup.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:content.story_cleanup.now_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {storyNow
                      ? format(storyNow, 'yyyy-MM-dd')
                      : t('operations:content.story_cleanup.now_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={storyNow} onSelect={setStoryNow} />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:content.story_cleanup.now_hint')}
              </p>
            </div>
          }
          onTrigger={handleStory}
          triggerLabel={t('operations:content.story_cleanup.trigger')}
          triggerPendingLabel="..."
          isPending={storyMut.isPending}
          result={
            storyResult ? (
              <TriggerResult
                ts={storyResult.ts}
                variant="sync-counters"
                title={t('operations:content.story_cleanup.result_label')}
                rows={buildContentRows(storyResult.result as ContentRunResult, 'story_cleanup')}
              />
            ) : undefined
          }
        />

        {/* Publish Scheduled Posts */}
        <TriggerCard
          title={t('operations:content.publish_scheduled.title')}
          icon={<Send className="size-5" />}
          description={t('operations:content.publish_scheduled.description')}
          formFields={
            <div className="flex flex-col gap-1.5">
              <Label>{t('operations:content.publish_scheduled.now_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <CalIcon className="mr-2 size-4" />
                    {publishNow
                      ? format(publishNow, 'yyyy-MM-dd')
                      : t('operations:content.publish_scheduled.now_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={publishNow} onSelect={setPublishNow} />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {t('operations:content.publish_scheduled.now_hint')}
              </p>
            </div>
          }
          onTrigger={handlePublish}
          triggerLabel={t('operations:content.publish_scheduled.trigger')}
          triggerPendingLabel="..."
          isPending={publishMut.isPending}
          result={
            publishResult ? (
              <TriggerResult
                ts={publishResult.ts}
                variant="sync-counters"
                title={t('operations:content.publish_scheduled.result_label')}
                rows={buildContentRows(
                  publishResult.result as ContentRunResult,
                  'publish_scheduled',
                )}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
