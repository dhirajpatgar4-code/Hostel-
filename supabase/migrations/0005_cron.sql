-- ============================================================
-- Scheduled Jobs (pg_cron)
-- ============================================================
create extension if not exists pg_cron;

-- Run overdue marking daily at 1:00 AM IST (19:30 UTC)
select cron.schedule('mark-overdue-rents', '30 19 * * *',
  $$ select public.mark_overdue_rents(); $$);

select cron.schedule('mark-overdue-electricity', '35 19 * * *',
  $$ select public.mark_overdue_electricity(); $$);