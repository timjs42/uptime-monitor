import type { Database } from "@/lib/supabase/database.types";
import { supabase } from "@/lib/supabase/server";
import type { MonitorCheckResult } from "@/lib/monitoring/check-monitor";

type MonitorRow =
  Database["public"]["Tables"]["monitors"]["Row"];

export type ActiveMonitor = Pick<
  MonitorRow,
  "id" | "name" | "url"
>;

export async function getActiveMonitors(): Promise<
  ActiveMonitor[]
> {
  const { data, error } = await supabase
    .from("monitors")
    .select("id, name, url")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load active monitors:", error);

    throw new Error("Failed to load active monitors");
  }

  return data;
}

export async function saveMonitorCheck(
  monitorId: string,
  result: MonitorCheckResult,
): Promise<void> {
  const { error } = await supabase
    .from("monitor_checks")
    .insert({
      monitor_id: monitorId,
      status_code: result.statusCode,
      response_time_ms: result.responseTimeMs,
      is_up: result.isUp,
      error_message: result.errorMessage,
    });

  if (error) {
    console.error(
      `Failed to save check for monitor ${monitorId}:`,
      error,
    );

    throw new Error("Failed to save monitor check");
  }
}