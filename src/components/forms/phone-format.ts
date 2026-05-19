export function maskKZPhone(e164: string): string {
  if (!e164 || !e164.startsWith('+')) return e164;
  const digits = e164.slice(1).replace(/\D/g, '');
  if (digits.length === 0) return '+';
  if (digits.startsWith('7')) {
    const rest = digits.slice(1, 11);
    let out = '+7';
    if (rest.length === 0) return out;
    out += ' (' + rest.slice(0, 3);
    if (rest.length >= 3) out += ')';
    if (rest.length > 3) out += ' ' + rest.slice(3, 6);
    if (rest.length > 6) out += '-' + rest.slice(6, 8);
    if (rest.length > 8) out += '-' + rest.slice(8, 10);
    return out;
  }
  return '+' + digits;
}

// KZ_MAX_DIGITS mirrors maskKZPhone's `digits.slice(1, 11)` (7 + 10 national).
// Без этого cap stored value может перерасти отображаемую маску на 1 цифру —
// маска обрезает только display, и лишняя цифра уходила в backend.
const KZ_MAX_DIGITS = 11;
const E164_MAX_DIGITS = 15;

export function normalizeToE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  let normalized = digits;
  if (digits.startsWith('8') && raw.trimStart().startsWith('8')) {
    normalized = '7' + digits.slice(1);
  }
  const cap = normalized.startsWith('7') ? KZ_MAX_DIGITS : E164_MAX_DIGITS;
  return '+' + normalized.slice(0, cap);
}

export function applyBackspaceCorrection(
  prevE164: string,
  newRaw: string,
  oldDisplay: string,
): string {
  const candidate = normalizeToE164(newRaw);
  if (candidate === prevE164 && prevE164 && newRaw.length < oldDisplay.length) {
    const trimmed = prevE164.slice(0, -1);
    return trimmed === '+' ? '' : trimmed;
  }
  return candidate;
}
