export type Task = {
  id: string;
  property_id: string;
  room_id: string | null;
  category_id: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  reminder_date: string | null;
  assigned_to: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  attachments: any;
  notes: string | null;
  completed_at: string | null;
  photos: { path: string; name: string; mime: string; size: number }[] | null;
  created_at: string;
  updated_at: string;
};

export type TaskCategory = {
  id: string;
  property_id: string;
  name: string;
  created_at: string;
};

export type TaskWithRelations = Task & {
  room_number: string | null;
  category_name: string | null;
};
