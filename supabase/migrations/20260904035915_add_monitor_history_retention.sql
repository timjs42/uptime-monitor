select cron.schedule(
  'cleanup-monitor-history',
  '15 3 * * *',
  $$
    delete from public.monitor_checks
    where checked_at < now() - interval '90 days';
  $$
);