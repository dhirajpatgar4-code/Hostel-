-- ============================================================
-- Business Functions
-- ============================================================

-- Occupancy snapshot for a property
create or replace function public.get_occupancy(p_property uuid)
returns table (
  total_rooms bigint,
  occupied_rooms bigint,
  vacant_rooms bigint,
  total_capacity bigint,
  occupied_beds bigint,
  available_beds bigint
) language sql stable as $$
  with active_rooms as (
    select id, capacity from public.rooms
    where property_id = p_property and archived = false
  ),
  active_allocs as (
    select a.room_id, count(*) as cnt
    from public.tenant_room_allocations a
    join public.tenants t on t.id = a.tenant_id
    where t.property_id = p_property and a.status = 'active'
    group by a.room_id
  )
  select
    (select count(*) from active_rooms),
    (select count(*) from active_rooms ar
       where coalesce((select cnt from active_allocs aa where aa.room_id = ar.id),0) > 0),
    (select count(*) from active_rooms ar
       where coalesce((select cnt from active_allocs aa where aa.room_id = ar.id),0) = 0),
    (select coalesce(sum(capacity),0) from active_rooms),
    (select coalesce(sum(cnt),0) from active_allocs),
    (select coalesce(sum(capacity),0) from active_rooms)
      - (select coalesce(sum(cnt),0) from active_allocs);
$$;

-- Mark overdue rent records
create or replace function public.mark_overdue_rents()
returns void language sql as $$
  update public.rent_records
    set status = 'overdue'
    where status in ('pending','partial')
      and due_date < current_date;
$$;

-- Mark overdue electricity bills
create or replace function public.mark_overdue_electricity()
returns void language sql as $$
  update public.electricity_bills
    set status = 'overdue'
    where status = 'pending'
      and due_date is not null
      and due_date < current_date;
$$;