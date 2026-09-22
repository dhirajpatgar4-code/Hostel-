export type Staff = {
  id: string;
  property_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  monthly_salary: number;
  joining_date: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave" | "holiday";

export type StaffAttendance = {
  id: string;
  staff_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SalaryPayment = {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  amount: number;
  paid_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
