-- Storage buckets and policies.
-- ============================================================
-- Storage Buckets + Policies
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('room-images', 'room-images', true),
  ('room-assets', 'room-assets', false),
  ('tenant-profiles', 'tenant-profiles', false),
  ('tenant-documents', 'tenant-documents', false),
  ('electricity-bills', 'electricity-bills', false),
  ('expenses-receipts', 'expenses-receipts', false),
  ('documents', 'documents', false),
  ('qr-codes', 'qr-codes', true),
  ('maintenance', 'maintenance', false)
on conflict (id) do nothing;

-- Public read for public buckets
create policy "public_read_room_images" on storage.objects
  for select using (bucket_id = 'room-images');
create policy "public_read_qr" on storage.objects
  for select using (bucket_id = 'qr-codes');

-- Authenticated read/write for private buckets based on path
-- Path convention: {bucket}/{property_id}/{...}
create policy "auth_read_private" on storage.objects
  for select using (
    bucket_id in ('room-assets','tenant-profiles','tenant-documents',
                  'electricity-bills','expenses-receipts','documents','maintenance')
    and auth.role() = 'authenticated'
  );

create policy "auth_write_private" on storage.objects
  for insert with check (
    bucket_id in ('room-assets','tenant-profiles','tenant-documents',
                  'electricity-bills','expenses-receipts','documents','maintenance',
                  'room-images','qr-codes')
    and auth.role() = 'authenticated'
  );

create policy "auth_update_private" on storage.objects
  for update using (auth.role() = 'authenticated');

create policy "auth_delete_private" on storage.objects
  for delete using (auth.role() = 'authenticated');