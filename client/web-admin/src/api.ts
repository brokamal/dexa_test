import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3005/api';
export const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

export function photoUrl(path?: string | null) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${SERVER_URL}${path}`;
}

export const api = axios.create({ baseURL: API_URL });

const TOKEN_KEY = 'wfh_admin_token';
const USER_KEY = 'wfh_admin_user';

export interface User {
  id: number;
  nip: string;
  fullName: string;
  email: string;
  role: string;
}

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSession() {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    user: JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null,
  };
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

api.interceptors.request.use((config) => {
  const { token } = getSession();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) clearSession();
    return Promise.reject(err);
  },
);

export function formatTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T'));
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLabel(value?: string | null) {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
