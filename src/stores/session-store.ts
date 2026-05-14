import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'super_admin' | 'support';

interface SessionState {
  email: string | null;
  role: Role | null;
  setSession: (s: { email: string; role: Role }) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      email: null,
      role: null,
      setSession: ({ email, role }) => set({ email, role }),
      clearSession: () => set({ email: null, role: null }),
    }),
    { name: 'shyraq.sa.session' },
  ),
);
