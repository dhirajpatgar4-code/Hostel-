export const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'card', 'other'] as const;
export const ROOM_ASSET_CONDITIONS = ['Good', 'Fair', 'Poor', 'Broken'] as const;
export const ROOM_ASSET_STATUSES = ['Working', 'Broken', 'Replaced'] as const;
export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const RENT_STATUSES = ['paid', 'pending', 'partial', 'overdue'] as const;
export const ELECTRICITY_STATUSES = ['pending', 'paid', 'overdue', 'photo_pending'] as const;
export const USER_ROLES = ['owner', 'manager', 'accountant', 'receptionist', 'staff'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];