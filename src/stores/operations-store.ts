import { create } from 'zustand';

type AnyResult = unknown;

interface OperationsState {
  results: Record<string, { ts: number; result: AnyResult }>;
  setResult: (key: string, result: AnyResult) => void;
  clearResult: (key: string) => void;
}

export const useOperationsStore = create<OperationsState>((set) => ({
  results: {},
  setResult: (key, result) =>
    set((s) => ({ results: { ...s.results, [key]: { ts: Date.now(), result } } })),
  clearResult: (key) =>
    set((s) => {
      const next = { ...s.results };
      delete next[key];
      return { results: next };
    }),
}));
