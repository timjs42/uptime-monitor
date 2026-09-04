create extension if not exists pg_cron;

create extension if not exists pg_net
with schema extensions;

select cron.schedule(
  'run-uptime-checks',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'uptime_monitor_url'
      ) || '/api/check',

      headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'monitoring_secret'
        )
      ),

      body := '{}'::jsonb,

      timeout_milliseconds := 15000
    ) as request_id;
  $$
);