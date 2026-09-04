import "server-only";

import { supabase } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;

const HISTORY_BUCKET_COUNT = 48;
const HISTORY_BUCKET_MS = DAY_IN_MS / HISTORY_BUCKET_COUNT;

export type MonitorStatus = "up" | "down" | "unknown";

export type UptimeHistoryStatus = "up" | "down" | "unknown";

export type UptimeHistoryBucket = {
  status: UptimeHistoryStatus;
  checkCount: number;
};

export type DashboardMonitor = {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string | null;
  uptime24h: number | null;
  totalChecks24h: number;
  history24h: UptimeHistoryBucket[];
};

export async function getDashboardMonitors(): Promise<
  DashboardMonitor[]
> {
  const now = Date.now();

  const { data: monitors, error: monitorsError } = await supabase
    .from("monitors")
    .select("id, name, url")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (monitorsError) {
    console.error(
      "Failed to load dashboard monitors:",
      monitorsError,
    );

    throw new Error("Failed to load dashboard monitors");
  }

  const activeMonitors = monitors ?? [];

  if (activeMonitors.length === 0) {
    return [];
  }

  const since = new Date(now - DAY_IN_MS).toISOString();

  const monitorIds = activeMonitors.map(
    (monitor) => monitor.id,
  );

  const { data: checks, error: checksError } = await supabase
    .from("monitor_checks")
    .select(
      "monitor_id, status_code, response_time_ms, is_up, checked_at",
    )
    .in("monitor_id", monitorIds)
    .gte("checked_at", since)
    .order("checked_at", { ascending: false });

  if (checksError) {
    console.error(
      "Failed to load monitor checks:",
      checksError,
    );

    throw new Error("Failed to load monitor checks");
  }

  const monitorChecks24h = checks ?? [];

  return activeMonitors.map((monitor) => {
    const monitorChecks = monitorChecks24h.filter(
      (check) => check.monitor_id === monitor.id,
    );

    const latestCheck = monitorChecks[0] ?? null;

    const successfulChecks = monitorChecks.filter(
      (check) => check.is_up,
    ).length;

    const uptime24h =
      monitorChecks.length > 0
        ? (successfulChecks / monitorChecks.length) * 100
        : null;

    const latestCheckTime = latestCheck
      ? new Date(latestCheck.checked_at).getTime()
      : null;

    const isStale =
      latestCheckTime === null ||
      now - latestCheckTime > STALE_AFTER_MS;

    let status: MonitorStatus = "unknown";

    if (!isStale && latestCheck) {
      status = latestCheck.is_up ? "up" : "down";
    }

    const history24h: UptimeHistoryBucket[] = Array.from(
      { length: HISTORY_BUCKET_COUNT },
      (_, index) => {
        const bucketStart =
          now - DAY_IN_MS + index * HISTORY_BUCKET_MS;

        const bucketEnd =
          bucketStart + HISTORY_BUCKET_MS;

        const bucketChecks = monitorChecks.filter(
          (check) => {
            const checkedAt = new Date(
              check.checked_at,
            ).getTime();

            return (
              checkedAt >= bucketStart &&
              checkedAt < bucketEnd
            );
          },
        );

        if (bucketChecks.length === 0) {
          return {
            status: "unknown",
            checkCount: 0,
          };
        }

        const hasFailure = bucketChecks.some(
          (check) => !check.is_up,
        );

        return {
          status: hasFailure ? "down" : "up",
          checkCount: bucketChecks.length,
        };
      },
    );

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status,
      statusCode: latestCheck?.status_code ?? null,
      responseTimeMs:
        latestCheck?.response_time_ms ?? null,
      checkedAt: latestCheck?.checked_at ?? null,
      uptime24h,
      totalChecks24h: monitorChecks.length,
      history24h,
    };
  });
}