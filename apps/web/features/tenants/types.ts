export type Tenant = {
  id: string;
  property_id: string;
  full_name: string;
  phone: string | null;
  aadhaar: string | null;
  pan: string | null;
  permanent_address: string | null;
  profile_photo_url: string | null;
  monthly_rent: number;
  security_deposit: number;
  status: "active" | "inactive" | "archived";
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type TenantAllocation = {
  id: string;
  tenant_id: string;
  room_id: string;
  allocation_date: string;
  deallocation_date: string | null;
  rent_amount: number;
  deposit_amount: number;
  status: "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantDocument = {
  id: string;
  tenant_id: string;
  doc_type: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type TenantWithRoom = Tenant & {
  current_room_id: string | null;
  current_room_number: string | null;
  allocation_id: string | null;
};

export const TENANT_DOC_TYPES = [
  "aadhaar",
  "pan",
  "driving_licence",
  "other_id",
  "agreement",
  "other",
] as const;

export type TenantDocType = (typeof TENANT_DOC_TYPES)[number];