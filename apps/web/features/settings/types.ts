export type TeamMember = {
  id: string;
  user_id: string;
  role: "owner" | "manager" | "accountant" | "receptionist" | "staff";
  email?: string | null;
  full_name?: string | null;
  created_at: string;
};

export type Invite = {
  id: string;
  property_id: string;
  email: string;
  role: "owner" | "manager" | "accountant" | "receptionist" | "staff";
  status: "pending" | "accepted" | "revoked";
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
};

export const USER_ROLES = ["owner", "manager", "accountant", "receptionist", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];
