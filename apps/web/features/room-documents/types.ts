export type RoomFolder = {
  id: string;
  property_id: string;
  room_id: string;
  parent_id: string | null;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomDocument = {
  id: string;
  property_id: string;
  room_id: string | null;
  folder_id: string | null;
  room_folder_id: string | null;
  category: string;
  title: string;
  description: string | null;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  tags: string[] | null;
  uploaded_by: string | null;
  archived: boolean;
  created_at: string;
};
