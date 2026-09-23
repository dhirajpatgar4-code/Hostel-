export type Expense = {
  id: string;
  property_id: string;
  room_id: string | null;
  category_id: string | null;
  description: string | null;
  amount: number;
  expense_date: string;
  payment_method: "cash" | "upi" | "bank_transfer" | "card" | "other";
  paid_to: string | null;
  receipt_url: string | null;
  notes: string | null;
  photos: { path: string; name: string; mime: string; size: number }[] | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory = {
  id: string;
  property_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
};

export type ExpenseWithRelations = Expense & {
  room_number: string | null;
  category_name: string | null;
};

export type InventoryItem = {
  id: string;
  property_id: string;
  item_type: string;
  identifier: string | null;
  condition: "Good" | "Fair" | "Poor" | "Broken";
  status: "available" | "allocated" | "broken" | "retired";
  room_id: string | null;
  photos: { path: string; name: string; mime: string; size: number }[] | null;
  created_at: string;
  updated_at: string;
};

export type InventoryTransaction = {
  id: string;
  item_id: string;
  room_id: string | null;
  tenant_id: string | null;
  action: string;
  notes: string | null;
  created_at: string;
};

export type InventoryItemWithRoom = InventoryItem & {
  room_number: string | null;
};
