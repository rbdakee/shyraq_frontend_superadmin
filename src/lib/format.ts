import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatPhoneE164(phone: string | null | undefined): string {
  if (!phone) return '';
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) return phone;
  if (phone.startsWith('+7') && phone.length === 12) {
    return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10, 12)}`;
  }
  return phone;
}

// locale param reserved for KK support — falls back to RU until OPEN_QUESTIONS C.6 resolves
export function formatRelativeTime(iso: string, locale: 'ru' | 'kk' = 'ru'): string {
  void locale;
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
}

export function formatCurrency(amount: number, currency: string = 'KZT'): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}
