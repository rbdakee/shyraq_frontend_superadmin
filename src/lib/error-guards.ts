export function isAppError(e: unknown): e is { status: number; code: string; details: unknown } {
  return (
    !!e &&
    typeof e === 'object' &&
    'status' in e &&
    typeof (e as Record<string, unknown>).status === 'number' &&
    'code' in e &&
    typeof (e as Record<string, unknown>).code === 'string'
  );
}
