import { useEffect, useState } from 'react';
import { api, formatDate, formatTime, photoUrl } from '../api';
import Badge from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { AttendanceRecord } from '../types';

export default function HistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    const [year, mon] = month.split('-').map(Number);
    const from = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, '0')}`;
    api
      .get<AttendanceRecord[]>('/attendance', { params: { from, to } })
      .then((res) => setRecords(res.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <Card>
      <CardHeader
        title="Kartu Riwayat Absensi"
        subtitle="Hanya absensi milik Anda yang dapat dilihat"
        action={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        }
      />
      {loading ? (
        <div className="grid gap-3 px-5 py-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          Tidak ada absensi untuk bulan ini
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {records.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-4">
              {r.checkInPhoto && (
                <img
                  src={photoUrl(r.checkInPhoto) as string}
                  alt="Foto absen"
                  className="h-14 w-14 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {formatDate(r.workDate)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Masuk {formatTime(r.checkInAt)} · {r.checkInNote ? 'Keluar ' : ''}
                  {r.checkOutAt ? `Keluar ${formatTime(r.checkOutAt)}` : 'Belum keluar'}
                </p>
                {r.checkInNote && (
                  <p className="mt-1 truncate text-xs italic text-slate-400">
                    “{r.checkInNote}”
                  </p>
                )}
              </div>
              <Badge tone={r.checkOutAt ? 'green' : 'amber'}>
                {r.checkOutAt ? 'Lengkap' : 'Belum keluar'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
