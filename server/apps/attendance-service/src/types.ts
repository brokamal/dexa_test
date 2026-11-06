export interface CheckInPayload {
  employeeId: number;
  photo?: { base64: string; ext: string };
  note?: string;
}

export interface CheckOutPayload {
  employeeId: number;
  photo?: { base64: string; ext: string };
}

export interface AttendanceQuery {
  employeeId?: number;
  from?: string;
  to?: string;
}
