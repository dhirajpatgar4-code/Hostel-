-- ============================================================
-- Row Level Security Policies
-- ============================================================
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_users enable row level security;
alter table public.hostel_settings enable row level security;
alter table public.rooms enable row level security;
alter table public.room_assets enable row level security;
alter table public.room_images enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_room_allocations enable row level security;
alter table public.tenant_documents enable row level security;
alter table public.rent_records enable row level security;
alter table public.deposit_records enable row level security;
alter table public.payment_records enable row level security;
alter table public.electricity_meters enable row level security;
alter table public.electricity_bills enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_categories enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_categories enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_categories enable row level security;
alter table public.documents enable row level security;
alter table public.payment_qr_codes enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.audit_logs enable row level security;

-- ─── Helper: is user member of property? ───────────────────
create or replace function public.user_in_property(p_property uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.property_users
    where property_id = p_property and user_id = auth.uid()
  );
$$;

create or replace function public.user_owns_room(p_room uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rooms r
    join public.property_users pu on pu.property_id = r.property_id
    where r.id = p_room and pu.user_id = auth.uid()
  );
$$;

-- ─── PROFILES ──────────────────────────────────────────────
create policy "profile_self_read" on public.profiles
  for select using (user_id = auth.uid());
create policy "profile_self_update" on public.profiles
  for update using (user_id = auth.uid());
create policy "profile_self_insert" on public.profiles
  for insert with check (user_id = auth.uid());

-- ─── PROPERTIES ────────────────────────────────────────────
create policy "properties_member_read" on public.properties
  for select using (public.user_in_property(id));
create policy "properties_owner_all" on public.properties
  for all using (
    exists (
      select 1 from public.property_users
      where property_id = properties.id
        and user_id = auth.uid() and role = 'owner'
    )
  );

-- ─── PROPERTY USERS ────────────────────────────────────────
create policy "pusers_read_own" on public.property_users
  for select using (user_id = auth.uid() or public.user_in_property(property_id));
create policy "pusers_owner_manage" on public.property_users
  for all using (
    exists (
      select 1 from public.property_users pu2
      where pu2.property_id = property_users.property_id
        and pu2.user_id = auth.uid() and pu2.role = 'owner'
    )
  );

-- ─── Generic property-scoped policy generator ──────────────
-- Applied per table below. Every write goes through membership check.

-- HOSTEL SETTINGS
create policy "settings_member_all" on public.hostel_settings
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- ROOMS
create policy "rooms_member_all" on public.rooms
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- ROOM ASSETS (via room's property)
create policy "room_assets_member_all" on public.room_assets
  for all using (public.user_owns_room(room_id))
  with check (public.user_owns_room(room_id));

-- ROOM IMAGES
create policy "room_images_member_all" on public.room_images
  for all using (public.user_owns_room(room_id))
  with check (public.user_owns_room(room_id));

-- TENANTS
create policy "tenants_member_all" on public.tenants
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- ALLOCATIONS
create policy "alloc_member_all" on public.tenant_room_allocations
  for all using (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_room_allocations.tenant_id
        and public.user_in_property(t.property_id)
    )
  )
  with check (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_room_allocations.tenant_id
        and public.user_in_property(t.property_id)
    )
  );

-- TENANT DOCS
create policy "tdocs_member_all" on public.tenant_documents
  for all using (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_documents.tenant_id
        and public.user_in_property(t.property_id)
    )
  )
  with check (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_documents.tenant_id
        and public.user_in_property(t.property_id)
    )
  );

-- RENT / DEPOSIT / PAYMENTS
create policy "rent_member_all" on public.rent_records
  for all using (
    exists (select 1 from public.tenants t
      where t.id = rent_records.tenant_id and public.user_in_property(t.property_id))
  ) with check (
    exists (select 1 from public.tenants t
      where t.id = rent_records.tenant_id and public.user_in_property(t.property_id))
  );

create policy "deposit_member_all" on public.deposit_records
  for all using (
    exists (select 1 from public.tenants t
      where t.id = deposit_records.tenant_id and public.user_in_property(t.property_id))
  ) with check (
    exists (select 1 from public.tenants t
      where t.id = deposit_records.tenant_id and public.user_in_property(t.property_id))
  );

create policy "payment_member_all" on public.payment_records
  for all using (
    exists (select 1 from public.tenants t
      where t.id = payment_records.tenant_id and public.user_in_property(t.property_id))
  ) with check (
    exists (select 1 from public.tenants t
      where t.id = payment_records.tenant_id and public.user_in_property(t.property_id))
  );

-- ELECTRICITY
create policy "emeter_member_all" on public.electricity_meters
  for all using (public.user_owns_room(room_id))
  with check (public.user_owns_room(room_id));

create policy "ebill_member_all" on public.electricity_bills
  for all using (public.user_owns_room(room_id))
  with check (public.user_owns_room(room_id));

-- EXPENSES
create policy "expense_cat_member_all" on public.expense_categories
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

create policy "expenses_member_all" on public.expenses
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- MAINTENANCE
create policy "mcat_member_all" on public.maintenance_categories
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

create policy "tasks_member_all" on public.maintenance_tasks
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- CONTACTS
create policy "ccat_member_all" on public.contact_categories
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

create policy "contacts_member_all" on public.contacts
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- DOCUMENTS
create policy "documents_member_all" on public.documents
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- QR CODES
create policy "qr_member_all" on public.payment_qr_codes
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

-- INVENTORY
create policy "inv_member_all" on public.inventory_items
  for all using (public.user_in_property(property_id))
  with check (public.user_in_property(property_id));

create policy "invtx_member_all" on public.inventory_transactions
  for all using (
    exists (select 1 from public.inventory_items i
      where i.id = inventory_transactions.item_id and public.user_in_property(i.property_id))
  ) with check (
    exists (select 1 from public.inventory_items i
      where i.id = inventory_transactions.item_id and public.user_in_property(i.property_id))
  );

-- NOTIFICATIONS
create policy "notif_self_all" on public.notifications
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifpref_self_all" on public.notification_preferences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- AUDIT LOGS
create policy "audit_read" on public.audit_logs
  for select using (
    property_id is null or public.user_in_property(property_id)
  );
create policy "audit_insert" on public.audit_logs
  for insert with check (user_id = auth.uid());