import { FormEvent, useState } from 'react';
import logoDexa from '../assets/logo-dexagroup-white.avif';
import Button from '../components/Button';
import { Field, PasswordInput } from '../components/Input';
import { useAuth } from '../auth';

export default function SetPasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Password baru tidak boleh sama dengan password saat ini.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? 'Gagal memperbarui password. Coba lagi.';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={logoDexa} alt="Dexa Group" className="mx-auto mb-4 h-14 w-auto" />
          <h1 className="text-2xl font-bold text-white">Ganti Password</h1>
          <p className="mt-1 text-sm text-red-200">
            Halo {user?.fullName}, Anda login dengan password default. Silakan
            buat password baru untuk melanjutkan.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-xl"
        >
          <Field label="Password saat ini">
            <PasswordInput
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Password dari Admin HRD"
            />
          </Field>
          <Field label="Password baru">
            <PasswordInput
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </Field>
          <Field label="Konfirmasi password baru">
            <PasswordInput
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" loading={saving} className="w-full">
            Simpan Password Baru
          </Button>
          <button
            type="button"
            onClick={logout}
            className="w-full text-center text-xs font-medium text-slate-500 hover:text-rose-600"
          >
            Keluar
          </button>
        </form>
      </div>
    </div>
  );
}
