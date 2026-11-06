export const MSG = {
  AUTH_LOGIN: 'auth.login',
  AUTH_CHANGE_PASSWORD: 'auth.change-password',

  EMP_LIST: 'employee.list',
  EMP_CREATE: 'employee.create',
  EMP_UPDATE: 'employee.update',

  ATT_CHECK_IN: 'attendance.check-in',
  ATT_CHECK_OUT: 'attendance.check-out',
  ATT_TODAY: 'attendance.today',
  ATT_LIST: 'attendance.list',
} as const;

export type MessagePattern = (typeof MSG)[keyof typeof MSG];

export function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function extFromMime(mime: string): string | null {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return null;
}

export function initials(fullName: string) {
  return fullName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
