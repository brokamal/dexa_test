import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { api, getSession, saveSession, clearSession, User } from './api';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => {
    throw new Error('not implemented');
  },
  changePassword: async () => undefined,
  logout: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const saved = getSession();
  const [user, setUser] = useState<User | null>(saved.user && saved.token ? saved.user : null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password });
        saveSession(data.accessToken, data.employee);
        setUser(data.employee);
        return data.employee as User;
      },
      async changePassword(currentPassword, newPassword) {
        await api.post('/auth/change-password', { currentPassword, newPassword });
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, mustChangePassword: false };
          saveSession(getSession().token ?? '', updated);
          return updated;
        });
      },
      logout() {
        clearSession();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
