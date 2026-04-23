import { create } from 'zustand';

import { clearSessionToken, setSessionToken } from '@/src/shared/lib/sessionStorage';

import type { AuthSession } from '../types/auth.types';

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: async (session) => {
    await setSessionToken(session.token);
    set({ session });
  },
  clearSession: async () => {
    await clearSessionToken();
    set({ session: null });
  },
}));
