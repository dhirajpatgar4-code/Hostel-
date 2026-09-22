export type RentStatus = "paid" | "pending" | "partial" | "overdue";

export type RentRecord = {
  id: string;
  tenant_id: string;
  allocation_id: string | null;
  month: number;
  year: number;
  rent_amount: number;
  due_date: string;
  paid_amount: number;
  pending_amount: number;
  status: RentStatus;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "card" | "other";

export type PaymentRecord = {
  id: string;
  tenant_id: string;
  rent_record_id: string | null;
  room_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_ref: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DepositRecord = {
  id: string;
  tenant_id: string;
  amount: number;
  received_date: string;
  refunded_amount: number;
  refunded_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentQR = {
  id: string;
  property_id: string;
  name: string;
  qr_image_url: string | null;
  upi_id: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RentRecordWithTenant = RentRecord & {
  tenant_name: string;
  room_number: string | null;
};

export type PaymentWithRelations = PaymentRecord & {
  tenant_name: string;
  room_number: string | null;
  month: number | null;
  year: number | null;
};