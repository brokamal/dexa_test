import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { api, getSession, saveSession, clearSession, User } from './api';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => undefined,
  logout: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const saved = getSession();
  const [user, setUser] = useState<User | null>(saved.user && saved.token ? saved.user : null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password, portal: 'admin' });
        if (data.employee?.role !== 'admin') throw new Error('not-admin');
        saveSession(data.accessToken, data.employee);
        setUser(data.employee);
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
