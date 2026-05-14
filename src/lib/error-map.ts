import { AppError } from '@/api/errors';

export function toI18nKey(error: unknown): string {
  if (error instanceof AppError) return `errors:${error.code}`;
  return 'errors:unknown_error';
}
