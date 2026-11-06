import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { api } from '../api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import { Field, TextInput } from '../components/Input';
import { EmployeeRecord } from '../types';

const emptyForm = {
  id: 0,
  nip: '',
  fullName: '',
  email: '',
  role: 'employee' as 'employee' | 'admin',
  position: '',
  department: '',
  phone: '',
  isActive: true,
};

export default function EmployeesPage() {
  const [rows, setRows] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<typeof emptyForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  let t: ReturnType<typeof setTimeout>;
  useEffect(() => {
    clearTimeout(t);
    t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load(s?: string) {
    setLoading(true);
    try {
      const { data } = await api.get<EmployeeRecord[]>('/employees', {
        params: s ? { search: s } : {},
      });
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setError(null);
    setModal({ ...emptyForm });
  }

  function openEdit(e: EmployeeRecord) {
    setError(null);
    setModal({
      id: e.id,
      nip: e.nip,
      fullName: e.fullName,
      email: e.email,
      role: e.role,
      position: e.position ?? '',
      department: e.department ?? '',
      phone: e.phone ?? '',
      isActive: e.isActive,
    });
  }

  async function save(ev: FormEvent) {
    ev.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError(null);
    const body: Record<string, string | boolean | undefined> = {
      fullName: modal.fullName,
      email: modal.email,
      role: modal.role,
      position: modal.position || undefined,
      department: modal.department || undefined,
      phone: modal.phone || undefined,
      isActive: modal.isActive,
    };
    // NIP is generated automatically when the employee/admin is created.
    if (modal.id) body.nip = modal.nip;
    try {
      if (modal.id) {
        await api.patch(`/employees/${modal.id}`, body);
        setNotice('Data karyawan berhasil diperbarui');
      } else {
        await api.post('/employees', body);
        setNotice('Karyawan baru berhasil ditambahkan');
      }
      setModal(null);
      await load(search);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? 'Gagal menyimpan data karyawan';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="animate-fade-in rounded-[2rem] bg-[#ff9e9e] p-5 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900/60">
              Admin HRD
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 sm:text-3xl">
              Data Master Karyawan
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-900/60">
              {rows.length} karyawan terdaftar
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, email…"
              className="w-full rounded-xl border border-black/10 bg-white/45 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-900/35 transition focus:border-slate-900/30 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 sm:w-64"
            />
            <Button onClick={openCreate}>+ Tambah Karyawan</Button>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      <Card>
        <CardHeader
          title="Daftar Karyawan"
          subtitle="Kelola akun dan data karyawan"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Karyawan</th>
                <th className="px-4 py-3 font-semibold">NIP</th>
                <th className="px-4 py-3 font-semibold">Posisi / Divisi</th>
                <th className="px-4 py-3 font-semibold">Kontak</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada data karyawan
                  </td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{e.fullName}</p>
                      <p className="text-xs text-slate-500">{e.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{e.nip}</td>
                    <td className="px-4 py-3">
                      <p>{e.position ?? '—'}</p>
                      <p className="text-xs text-slate-500">{e.department ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={e.role === 'admin' ? 'amber' : 'slate'}>
                        {e.role === 'admin' ? 'Admin' : 'Karyawan'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={e.isActive ? 'green' : 'rose'}>
                        {e.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(e)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal onClose={() => setModal(null)} title={modal.id ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={modal.id ? 'NIP' : 'NIP (otomatis)'}>
                <TextInput
                  required={!!modal.id}
                  value={modal.nip}
                  placeholder={modal.id ? undefined : 'Dibuat otomatis saat disimpan'}
                  disabled={!modal.id}
                  onChange={(e) => setModal({ ...modal, nip: e.target.value })}
                />
              </Field>
              <Field label="Nama Lengkap">
                <TextInput required value={modal.fullName} onChange={(e) => setModal({ ...modal, fullName: e.target.value })} />
              </Field>
              <Field label="Email">
                <TextInput type="email" required value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} />
              </Field>
              {!modal.id && (
                <div className="col-span-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                  Password awal karyawan otomatis: <span className="font-semibold">password123</span>. Karyawan wajib menggantinya saat login pertama.
                </div>
              )}
              <Field label="Posisi">
                <TextInput value={modal.position} onChange={(e) => setModal({ ...modal, position: e.target.value })} />
              </Field>
              <Field label="Divisi">
                <TextInput value={modal.department} onChange={(e) => setModal({ ...modal, department: e.target.value })} />
              </Field>
              <Field label="No. HP">
                <TextInput value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} />
              </Field>
              <Field label="Role">
                <select
                  value={modal.role}
                  onChange={(e) => setModal({ ...modal, role: e.target.value as 'employee' | 'admin' })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                >
                  <option value="employee">Karyawan</option>
                  <option value="admin">Admin HRD</option>
                </select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={modal.isActive}
                onChange={(e) => setModal({ ...modal, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Aktif (bisa login &amp; melakukan absensi)
            </label>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setModal(null)}>
                Batal
              </Button>
              <Button type="submit" loading={saving}>
                {modal.id ? 'Simpan Perubahan' : 'Tambah Karyawan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
