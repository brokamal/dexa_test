export interface EmployeeRecord {
  id: number;
  nip: string;
  fullName: string;
  email: string;
  role: 'employee' | 'admin';
  position: string | null;
  department: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  workDate: string;
  checkInAt: string | null;
  checkInPhoto: string | null;
  checkInNote: string | null;
  checkOutAt: string | null;
  checkOutPhoto: string | null;
  employee?: EmployeeRecord;
}

export interface APIError<T = unknown> {
  response?: { data?: { message?: string } };
}
