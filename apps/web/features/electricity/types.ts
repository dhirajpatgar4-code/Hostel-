export type ElectricityMeter = {
  id: string;
  room_id: string;
  consumer_number: string | null;
  meter_number: string | null;
  current_reading: number | null;
  previous_reading: number | null;
  created_at: string;
  updated_at: string;
};

export type ElectricityBillStatus = "pending" | "paid" | "overdue" | "photo_pending";

export type ElectricityBill = {
  id: string;
  room_id: string;
  meter_id: string | null;
  billing_month: number;
  billing_year: number;
  bill_amount: number;
  bill_date: string | null;
  due_date: string | null;
  meter_reading: number | null;
  bill_photo_url: string | null;
  status: ElectricityBillStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ElectricityBillWithRoom = ElectricityBill & {
  room_number: string;
  property_id: string;
};