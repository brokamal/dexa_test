import { useCallback, useEffect, useState } from 'react';
import { api, formatTime, photoUrl, todayLabel } from '../api';
import { useAuth } from '../auth';
import { useClock } from '../hooks/useClock';
import PhotoPicker from '../components/PhotoPicker';
import { AttendanceRecord, APIError } from '../types';

interface TodayAttendance {
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInPhoto: string | null;
  checkInNote: string | null;
  workDate: string;
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function clockParts(date: Date) {
  return {
    time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    seconds: String(date.getSeconds()).padStart(2, '0'),
  };
}

export default function AbsenPage() {
  const now = useClock();
  const { user } = useAuth();
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadToday = useCallback(() => {
    api
      .get<TodayAttendance | null>('/attendance/me/today')
      .then((res) => setToday(res.data))
      .catch(() => setToday(null));
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  // Keep the page in sync with the server, which closes attendance
  // automatically once the 5 PM cutoff has passed.
  useEffect(() => {
    const id = setInterval(loadToday, 30_000);
    return () => clearInterval(id);
  }, [loadToday]);

  async function checkIn() {
    if (!photo) {
      setError('Ambil foto selfie sebagai bukti WFH sebelum absen masuk.');
      return;
    }
    await submitAttendance('/attendance/check-in', photo, note.trim() || undefined);
    setNote('');
  }

  async function checkOut() {
    setPhoto(null);
    await submitAttendance('/attendance/check-out', null);
  }

  async function submitAttendance(url: string, file: File | null, note?: string) {
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      if (file) form.append('photo', file);
      if (note) form.append('note', note);
      await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhoto(null);
      loadToday();
    } catch (err) {
      const apiErr = err as APIError<AttendanceRecord>;
      setError(apiErr.response?.data?.message ?? 'Gagal menyimpan absensi. Coba lagi.');
      setPhoto(null);
    } finally {
      setSubmitting(false);
    }
  }

  const checkedIn = !!today?.checkInAt;
  const checkedOut = !!today?.checkOutAt;
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'Karyawan';
  const { time, seconds } = clockParts(now);
  const actionDisabled = submitting || (checkedIn ? checkedOut : !photo);

  return (
    <div className="animate-fade-in rounded-[2rem] bg-[#ff9e9e] p-5 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
        {/* Left: greeting, clock & action */}
        <section className="flex min-h-[520px] flex-col">
          <div>
            <h1 className="text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {greetingFor(now)} {firstName}!
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-900/60">{todayLabel(now)}</p>
          </div>

          <div className="mt-10">
            <p className="text-base font-bold uppercase tracking-[0.18em] text-slate-900/70">
              Waktu
            </p>
            <p className="mt-1 flex items-baseline font-black tabular-nums tracking-tighter text-slate-950">
              <span className="text-6xl sm:text-7xl">{time}</span>
              <span className="ml-1 text-2xl text-slate-900/50 sm:text-3xl">:{seconds}</span>
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900/60">
              {watchedStatus(checkedIn, checkedOut)}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <StatusTile label="Absen masuk" value={formatTime(today?.checkInAt)} active={checkedIn} />
            <StatusTile label="Absen keluar" value={formatTime(today?.checkOutAt)} active={checkedOut} />
          </div>

          <div className="mt-auto space-y-4 pt-8">
            {!checkedIn && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-900/60">
                  Catatan (opsional)
                </span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="cth. mengerjakan modul login"
                  disabled={submitting}
                  className="w-full rounded-xl border border-black/10 bg-white/45 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-900/35 transition focus:border-slate-900/30 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60"
                />
              </label>
            )}

            {error && (
              <p className="rounded-xl border border-rose-900/20 bg-rose-100/70 px-4 py-3 text-sm font-medium text-rose-800">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={checkedIn ? checkOut : checkIn}
              disabled={actionDisabled}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#d9d9d9] px-6 py-6 text-base font-bold text-slate-900 transition hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#d9d9d9] disabled:hover:shadow-none"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-slate-800" />
              ) : (
                <ActionIcon checkedIn={checkedIn} checkedOut={checkedOut} />
              )}
              {checkedOut ? 'Absen Selesai' : checkedIn ? 'Absen Keluar' : 'Absen Masuk'}
            </button>

            {!checkedIn && !photo && (
              <p className="text-center text-xs font-medium text-slate-900/55">
                Ambil foto selfie di kamera terlebih dahulu.
              </p>
            )}
          </div>
        </section>

        {/* Right: camera / captured selfie */}
        <section className="flex min-h-[420px] flex-col rounded-[1.5rem] bg-[#d9d9d9] p-3 sm:p-4 lg:min-h-[560px]">
          {checkedIn ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-800">
              {today?.checkInPhoto ? (
                <img
                  src={photoUrl(today.checkInPhoto) as string}
                  alt="Foto absen masuk"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
                  Foto absen tidak tersedia
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-5 pb-5 pt-16 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <span className={`h-1.5 w-1.5 rounded-full ${checkedOut ? 'bg-white' : 'bg-emerald-300'}`} />
                  {checkedOut ? 'Absensi hari ini selesai' : 'Sedang bekerja'}
                </span>
                <p className="mt-2 text-lg font-bold">Absen masuk {formatTime(today?.checkInAt)}</p>
                {!checkedOut && (
                  <p className="mt-0.5 text-xs text-white/70">
                    Absen keluar otomatis pukul 17.00 jika belum melakukan absen keluar.
                  </p>
                )}
                {today?.checkInNote && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/70">“{today.checkInNote}”</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <PhotoPicker
                fill
                onChange={setPhoto}
                disabled={submitting}
                hint="Posisikan wajah di tengah bingkai"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function watchedStatus(checkedIn: boolean, checkedOut: boolean) {
  if (checkedOut) return 'Absensi hari ini sudah lengkap. Sampai jumpa besok!';
  if (checkedIn) return 'Jangan lupa absen keluar saat selesai bekerja.';
  return 'Silakan ambil foto selfie untuk memulai absensi.';
}

function StatusTile({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/35 px-4 py-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-900/55">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-950">
        {active ? value : '—'}
      </p>
    </div>
  );
}

function ActionIcon({ checkedIn, checkedOut }: { checkedIn: boolean; checkedOut: boolean }) {
  if (checkedOut) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    );
  }
  if (checkedIn) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}
