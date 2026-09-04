import "server-only";

import { supabase } from "@/lib/supabase/server";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 15 * 60 * 1000;

export type MonitorStatus = "up" | "down" | "unknown";

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
};

export async function getDashboardMonitors(): Promise<
  DashboardMonitor[]
> {
  const { data: monitors, error: monitorsError } = await supabase
    .from("monitors")
    .select("id, name, url")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (monitorsError) {
    console.error("Failed to load dashboard monitors:", monitorsError);
    throw new Error("Failed to load dashboard monitors");
  }

  if (monitors.length === 0) {
    return [];
  }

  const since = new Date(Date.now() - DAY_IN_MS).toISOString();

  const monitorIds = monitors.map((monitor) => monitor.id);

  const { data: checks, error: checksError } = await supabase
    .from("monitor_checks")
    .select(
      "monitor_id, status_code, response_time_ms, is_up, checked_at",
    )
    .in("monitor_id", monitorIds)
    .gte("checked_at", since)
    .order("checked_at", { ascending: false });

  if (checksError) {
    console.error("Failed to load monitor checks:", checksError);
    throw new Error("Failed to load monitor checks");
  }

  return monitors.map((monitor) => {
    const monitorChecks = checks.filter(
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
      Date.now() - latestCheckTime > STALE_AFTER_MS;

    let status: MonitorStatus = "unknown";

    if (!isStale && latestCheck) {
      status = latestCheck.is_up ? "up" : "down";
    }

    return {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status,
      statusCode: latestCheck?.status_code ?? null,
      responseTimeMs: latestCheck?.response_time_ms ?? null,
      checkedAt: latestCheck?.checked_at ?? null,
      uptime24h,
      totalChecks24h: monitorChecks.length,
    };
  });
}