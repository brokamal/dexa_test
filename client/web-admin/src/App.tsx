import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';

export default function App() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={user ? <Forbidden /> : <Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#d9d9d9]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Forbidden() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d9d9d9] px-4">
      <p className="text-slate-600">
        Halaman ini hanya untuk Admin HRD. <a href="/login" className="font-semibold text-brand-600">Ganti akun</a>
      </p>
    </div>
  );
}
