-- ============================================================
-- HostelHub PMS — Initial Schema
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Helper: updated_at trigger ────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'owner'
    check (role in ('owner','manager','accountant','receptionist','staff')),
  fcm_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.phone,''));
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── PROPERTIES ────────────────────────────────────────────
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'My Hostel',
  address text,
  phone text,
  email text,
  maps_link text,
  logo_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_properties_updated before update on public.properties
  for each row execute function public.set_updated_at();

create table public.property_users (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner','manager','accountant','receptionist','staff')),
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);
create index idx_property_users_user on public.property_users(user_id);
create index idx_property_users_property on public.property_users(property_id);

-- ─── HOSTEL SETTINGS ───────────────────────────────────────
create table public.hostel_settings (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null unique references public.properties(id) on delete cascade,
  rent_due_day int not null default 5 check (rent_due_day between 1 and 28),
  rent_reminder_days int not null default 3,
  grace_period_days int not null default 5,
  electricity_reminder_day int not null default 10,
  currency text not null default 'INR',
  date_format text not null default 'DD/MM/YYYY',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_hostel_settings_updated before update on public.hostel_settings
  for each row execute function public.set_updated_at();

-- ─── ROOMS ─────────────────────────────────────────────────
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_number text not null,
  floor int,
  room_type text,
  capacity int not null default 1 check (capacity > 0),
  description text,
  google_drive_url text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, room_number)
);
create index idx_rooms_property on public.rooms(property_id);
create index idx_rooms_number on public.rooms(room_number);
create trigger trg_rooms_updated before update on public.rooms
  for each row execute function public.set_updated_at();

create table public.room_assets (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  asset_name text not null,
  quantity int not null default 1 check (quantity >= 0),
  condition text not null default 'Good'
    check (condition in ('Good','Fair','Poor','Broken')),
  status text not null default 'Working'
    check (status in ('Working','Broken','Replaced')),
  purchase_date date,
  notes text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_room_assets_room on public.room_assets(room_id);
create trigger trg_room_assets_updated before update on public.room_assets
  for each row execute function public.set_updated_at();

create table public.room_images (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  storage_path text not null,
  original_filename text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_room_images_room on public.room_images(room_id);

-- ─── TENANTS ───────────────────────────────────────────────
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  full_name text not null,
  phone text,
  aadhaar text,
  pan text,
  permanent_address text,
  profile_photo_url text,
  monthly_rent numeric(12,2) not null default 0 check (monthly_rent >= 0),
  security_deposit numeric(12,2) not null default 0 check (security_deposit >= 0),
  status text not null default 'active'
    check (status in ('active','inactive','archived')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tenants_property on public.tenants(property_id);
create index idx_tenants_name on public.tenants(full_name);
create index idx_tenants_phone on public.tenants(phone);
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();

create table public.tenant_room_allocations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  allocation_date date not null default current_date,
  deallocation_date date,
  rent_amount numeric(12,2) not null default 0 check (rent_amount >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  status text not null default 'active'
    check (status in ('active','completed','cancelled')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deallocation_date is null or deallocation_date >= allocation_date)
);
create index idx_alloc_tenant on public.tenant_room_allocations(tenant_id);
create index idx_alloc_room on public.tenant_room_allocations(room_id);
create index idx_alloc_status on public.tenant_room_allocations(status);
create trigger trg_alloc_updated before update on public.tenant_room_allocations
  for each row execute function public.set_updated_at();

create table public.tenant_documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_tenant_docs_tenant on public.tenant_documents(tenant_id);

-- ─── RENT / DEPOSIT / PAYMENTS ─────────────────────────────
create table public.rent_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  allocation_id uuid references public.tenant_room_allocations(id) on delete set null,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2100),
  rent_amount numeric(12,2) not null check (rent_amount >= 0),
  due_date date not null,
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  pending_amount numeric(12,2) not null default 0 check (pending_amount >= 0),
  status text not null default 'pending'
    check (status in ('paid','pending','partial','overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, month, year)
);
create index idx_rent_tenant on public.rent_records(tenant_id);
create index idx_rent_status on public.rent_records(status);
create index idx_rent_period on public.rent_records(year, month);
create trigger trg_rent_updated before update on public.rent_records
  for each row execute function public.set_updated_at();

create table public.deposit_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  received_date date not null default current_date,
  refunded_amount numeric(12,2) not null default 0 check (refunded_amount >= 0),
  refunded_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_deposit_tenant on public.deposit_records(tenant_id);
create trigger trg_deposit_updated before update on public.deposit_records
  for each row execute function public.set_updated_at();

create table public.payment_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rent_record_id uuid references public.rent_records(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text not null default 'cash'
    check (payment_method in ('cash','upi','bank_transfer','card','other')),
  transaction_ref text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payment_tenant on public.payment_records(tenant_id);
create index idx_payment_date on public.payment_records(payment_date);
create trigger trg_payment_updated before update on public.payment_records  for each row execute function public.set_updated_at();

-- Auto-update rent_record when payment inserted
create or replace function public.apply_payment_to_rent()
returns trigger language plpgsql as $$
declare
  v_total_paid numeric(12,2);
  v_rent numeric(12,2);
begin
  if new.rent_record_id is null then
    return new;
  end if;
  select coalesce(sum(amount),0) into v_total_paid
    from public.payment_records where rent_record_id = new.rent_record_id;
  select rent_amount into v_rent from public.rent_records where id = new.rent_record_id;
  update public.rent_records
    set paid_amount = v_total_paid,
        pending_amount = greatest(v_rent - v_total_paid, 0),
        status = case
          when v_total_paid >= v_rent then 'paid'
          when v_total_paid > 0 then 'partial'
          when due_date < current_date then 'overdue'
          else 'pending'
        end
    where id = new.rent_record_id;
  return new;
end $$;
create trigger trg_apply_payment
  after insert or update or delete on public.payment_records
  for each row execute function public.apply_payment_to_rent();

-- ─── ELECTRICITY ───────────────────────────────────────────
create table public.electricity_meters (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  consumer_number text,
  meter_number text,
  current_reading numeric(12,2),
  previous_reading numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id)
);
create trigger trg_meter_updated before update on public.electricity_meters
  for each row execute function public.set_updated_at();

create table public.electricity_bills (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  meter_id uuid references public.electricity_meters(id) on delete set null,
  billing_month int not null check (billing_month between 1 and 12),
  billing_year int not null check (billing_year between 2000 and 2100),
  bill_amount numeric(12,2) not null default 0 check (bill_amount >= 0),
  bill_date date,
  due_date date,
  meter_reading numeric(12,2),
  bill_photo_url text,
  status text not null default 'pending'
    check (status in ('pending','paid','overdue','photo_pending')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, billing_month, billing_year)
);
create index idx_elec_room on public.electricity_bills(room_id);
create index idx_elec_period on public.electricity_bills(billing_year, billing_month);
create index idx_elec_status on public.electricity_bills(status);
create trigger trg_elec_updated before update on public.electricity_bills
  for each row execute function public.set_updated_at();

-- ─── EXPENSES ──────────────────────────────────────────────
create table public.expense_categories (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);
create index idx_expcat_property on public.expense_categories(property_id);

create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category_id uuid references public.expense_categories(id) on delete set null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  payment_method text not null default 'cash'
    check (payment_method in ('cash','upi','bank_transfer','card','other')),
  paid_to text,
  receipt_url text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_exp_property on public.expenses(property_id);
create index idx_exp_room on public.expenses(room_id);
create index idx_exp_date on public.expenses(expense_date);
create trigger trg_exp_updated before update on public.expenses
  for each row execute function public.set_updated_at();

-- ─── MAINTENANCE ───────────────────────────────────────────
create table public.maintenance_categories (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create table public.maintenance_tasks (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category_id uuid references public.maintenance_categories(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  due_date date,
  reminder_date date,
  assigned_to text,
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  attachments jsonb default '[]'::jsonb,
  notes text,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_task_property on public.maintenance_tasks(property_id);
create index idx_task_room on public.maintenance_tasks(room_id);
create index idx_task_status on public.maintenance_tasks(status);
create index idx_task_due on public.maintenance_tasks(due_date);
create trigger trg_task_updated before update on public.maintenance_tasks
  for each row execute function public.set_updated_at();

-- ─── CONTACTS ──────────────────────────────────────────────
create table public.contact_categories (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category_id uuid references public.contact_categories(id) on delete set null,
  name text not null,
  phone text,
  whatsapp text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contact_property on public.contacts(property_id);
create trigger trg_contact_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ─── DOCUMENTS ─────────────────────────────────────────────
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  category text not null default 'other',
  title text not null,
  description text,
  storage_path text not null,
  original_filename text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references auth.users(id),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_doc_property on public.documents(property_id);
create index idx_doc_category on public.documents(category);

-- ─── QR CODES ──────────────────────────────────────────────
create table public.payment_qr_codes (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  qr_image_url text,
  upi_id text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_qr_updated before update on public.payment_qr_codes
  for each row execute function public.set_updated_at();

-- ─── INVENTORY ─────────────────────────────────────────────
create table public.inventory_items (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  item_type text not null,
  identifier text,
  condition text not null default 'Good'
    check (condition in ('Good','Fair','Poor','Broken')),
  status text not null default 'available'
    check (status in ('available','allocated','broken','retired')),
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_inv_property on public.inventory_items(property_id);
create index idx_inv_type on public.inventory_items(item_type);
create trigger trg_inv_updated before update on public.inventory_items
  for each row execute function public.set_updated_at();

create table public.inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  action text not null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_invtx_item on public.inventory_transactions(item_id);

-- ─── NOTIFICATIONS ─────────────────────────────────────────
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notif_user on public.notifications(user_id);
create index idx_notif_read on public.notifications(is_read);

create table public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  rent_reminders boolean not null default true,
  electricity_reminders boolean not null default true,
  task_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_notifpref_updated before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ─── AUDIT LOGS ────────────────────────────────────────────
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_user on public.audit_logs(user_id);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ─── SEED DEFAULT CATEGORIES ON PROPERTY CREATE ────────────
create or replace function public.seed_property_defaults()
returns trigger language plpgsql as $$
begin
  insert into public.hostel_settings (property_id) values (new.id);

  insert into public.expense_categories (property_id, name, is_system) values
    (new.id,'Room Maintenance',true),
    (new.id,'Electricity',true),
    (new.id,'Water',true),
    (new.id,'Cleaner',true),
    (new.id,'Kamwali Aunty',true),
    (new.id,'Plumber',true),
    (new.id,'Electrician',true),
    (new.id,'WiFi',true),
    (new.id,'Drainage',true),
    (new.id,'Repairs',true),
    (new.id,'Furniture',true),
    (new.id,'Equipment',true),
    (new.id,'Other',true);

  insert into public.contact_categories (property_id, name, is_system) values
    (new.id,'Electrician',true),
    (new.id,'Plumber',true),
    (new.id,'Drainage Cleaner',true),
    (new.id,'WiFi Specialist',true),
    (new.id,'Carpenter',true),
    (new.id,'Painter',true),
    (new.id,'AC Technician',true),
    (new.id,'Appliance Technician',true),
    (new.id,'Security',true),
    (new.id,'Cleaner',true),
    (new.id,'Other',true);

  insert into public.maintenance_categories (property_id, name) values
    (new.id,'Plumbing'),
    (new.id,'Electrical'),
    (new.id,'Furniture'),
    (new.id,'Cleaning'),
    (new.id,'Appliance'),
    (new.id,'Other');

  return new;
end $$;
create trigger trg_seed_property
  after insert on public.properties
  for each row execute function public.seed_property_defaults();