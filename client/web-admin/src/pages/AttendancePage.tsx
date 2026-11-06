import { useEffect, useMemo, useState } from 'react';
import { api, formatDateLabel, formatTime, photoUrl } from '../api';
import Badge from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Modal } from './EmployeesPage';
import { AttendanceRecord, EmployeeRecord } from '../types';

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => monthStart());
  const [to, setTo] = useState(() => todayIso());
  const [employeeId, setEmployeeId] = useState('');
  const [preview, setPreview] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    api.get<EmployeeRecord[]>('/employees').then((r) => setEmployees(r.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<AttendanceRecord[]>('/attendance', {
        params: { from, to, employeeId: employeeId || undefined },
      })
      .then((r) => setRecords(r.data))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [from, to, employeeId]);

  const summary = useMemo(() => {
    const checkedIn = records.filter((r) => r.checkInAt).length;
    const completed = records.filter((r) => r.checkInAt && r.checkOutAt).length;
    return { total: records.length, checkedIn, completed };
  }, [records]);

  return (
    <div className="space-y-4">
      <section className="animate-fade-in rounded-[2rem] bg-[#ff9e9e] p-5 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900/60">
              Admin HRD
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 sm:text-3xl">
              Monitoring Absensi WFH
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-900/60">
              Pantau absensi WFH seluruh karyawan. Data bersifat view-only.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <SummaryTile label="Total" value={summary.total} tone="bg-slate-800" />
            <SummaryTile label="Check-in" value={summary.checkedIn} tone="bg-amber-500" />
            <SummaryTile label="Lengkap" value={summary.completed} tone="bg-emerald-600" />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader
          title="Data Absensi"
          subtitle="Filter berdasarkan rentang tanggal dan karyawan"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-300 px-2.5 py-2 text-sm" />
              <span className="text-xs text-slate-400">s/d</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-300 px-2.5 py-2 text-sm" />
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm"
              >
                <option value="">Semua karyawan</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Karyawan</th>
                <th className="px-4 py-3 font-semibold">Masuk</th>
                <th className="px-4 py-3 font-semibold">Keluar</th>
                <th className="px-4 py-3 font-semibold">Catatan</th>
                <th className="px-4 py-3 font-semibold">Bukti Foto</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-6 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada absensi pada rentang ini
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-700">{formatDateLabel(r.workDate)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.employee?.fullName ?? `#${r.employeeId}`}</p>
                      <p className="text-xs text-slate-500">{r.employee?.nip}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatTime(r.checkInAt)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatTime(r.checkOutAt)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">{r.checkInNote ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.checkInPhoto ? (
                        <button onClick={() => setPreview(r)}>
                          <img
                            src={photoUrl(r.checkInPhoto) as string}
                            alt="bukti"
                            className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.checkOutAt ? 'green' : r.checkInAt ? 'amber' : 'slate'}>
                        {r.checkOutAt ? 'Lengkap' : r.checkInAt ? 'Sedang WFH' : 'Belum masuk'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {preview && (
        <Modal title={`Bukti Absensi — ${preview.employee?.fullName ?? ''}`} onClose={() => setPreview(null)}>
          <img
            src={photoUrl(preview.checkInPhoto) as string}
            alt="bukti absensi"
            className="w-full rounded-xl object-contain"
          />
          <dl className="mt-4 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Tanggal</dt><dd className="font-medium text-slate-800">{formatDateLabel(preview.workDate)}</dd></div>
            <div className="flex justify-between"><dt>Check-in</dt><dd className="font-medium text-slate-800">{formatTime(preview.checkInAt)}</dd></div>
            <div className="flex justify-between"><dt>Check-out</dt><dd className="font-medium text-slate-800">{formatTime(preview.checkOutAt)}</dd></div>
            {preview.checkInNote && (
              <div className="flex justify-between"><dt>Catatan</dt><dd className="font-medium text-slate-800">{preview.checkInNote}</dd></div>
            )}
          </dl>
        </Modal>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-white/35 px-3 py-3 sm:px-4">
      <div className={`mb-2 h-1.5 w-8 rounded-full ${tone}`} />
      <p className="text-2xl font-black tabular-nums text-slate-950">{value}</p>
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-slate-900/55">
        {label}
      </p>
    </div>
  );
}

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthStart() {
  return `${todayIso().slice(0, 7)}-01`;
}
