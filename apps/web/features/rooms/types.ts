export type Room = {
  id: string;
  property_id: string;
  room_number: string;
  floor: number | null;
  room_type: string | null;
  capacity: number;
  description: string | null;
  google_drive_url: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type RoomAsset = {
  id: string;
  room_id: string;
  asset_name: string;
  quantity: number;
  condition: "Good" | "Fair" | "Poor" | "Broken";
  status: "Working" | "Broken" | "Replaced";
  purchase_date: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomImage = {
  id: string;
  room_id: string;
  storage_path: string;
  original_filename: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
};

export type RoomWithOccupancy = Room & {
  occupied: number;
  status: "available" | "partially_occupied" | "fully_occupied" | "maintenance" | "inactive";
  primary_image_url: string | null;
};