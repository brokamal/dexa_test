import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import logoDexa from '../assets/logo-dexagroup-white.avif';
import Button from '../components/Button';
import { Field, TextInput, PasswordInput } from '../components/Input';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      nav('/');
    } catch (err) {
      const notAdmin =
        (err instanceof Error && err.message === 'not-admin') ||
        (axios.isAxiosError(err) && err.response?.status === 403);
      setError(
        notAdmin
          ? 'Akun ini bukan Admin HRD. Silakan gunakan portal karyawan.'
          : 'Email atau password salah, atau akun tidak aktif.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-red-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={logoDexa}
            alt="Dexa Group"
            className="mx-auto mb-4 h-14 w-auto"
          />
          <h1 className="text-2xl font-bold text-white">Portal Monitoring Karyawan</h1>
          
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-xl"
        >
          <Field label="Email">
            <TextInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukan alamat email disini"
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} className="w-full">
            Masuk sebagai Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
