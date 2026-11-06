import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import logoDexa from '../assets/logo-dexagroup-white.avif';

const links = [
  { to: '/', label: 'Absensi' },
  { to: '/history', label: 'Riwayat' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <img src={logoDexa} alt="Dexa Group" className="h-9 w-auto rounded-lg bg-red-900 px-2 py-1" />
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  pathname === l.to
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
          </div>
          <button
            onClick={() => {
              logout();
              nav('/login');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600"
          >
            Keluar
          </button>
        </div>
      </div>
      <nav className="flex border-t border-slate-100 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              pathname === l.to ? 'text-brand-700' : 'text-slate-500'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
