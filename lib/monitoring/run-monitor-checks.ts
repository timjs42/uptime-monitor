import "server-only";

import {
  getActiveMonitors,
  saveMonitorCheck,
  type ActiveMonitor,
} from "@/lib/database/monitors";
import {
  checkMonitor,
  type MonitorCheckResult,
} from "@/lib/monitoring/check-monitor";

export type MonitorRunResult = {
  monitorId: string;
  name: string;
  url: string;
  check: MonitorCheckResult | null;
  persisted: boolean;
  error: string | null;
};

async function runSingleMonitor(
  monitor: ActiveMonitor,
): Promise<MonitorRunResult> {
  try {
    const check = await checkMonitor(monitor.url);

    await saveMonitorCheck(monitor.id, check);

    return {
      monitorId: monitor.id,
      name: monitor.name,
      url: monitor.url,
      check,
      persisted: true,
      error: null,
    };
  } catch (error) {
    console.error(
      `Failed to run monitor "${monitor.name}":`,
      error,
    );

    return {
      monitorId: monitor.id,
      name: monitor.name,
      url: monitor.url,
      check: null,
      persisted: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown monitoring error",
    };
  }
}

export async function runMonitorChecks(): Promise<
  MonitorRunResult[]
> {
  const monitors = await getActiveMonitors();

  return Promise.all(
    monitors.map((monitor) => runSingleMonitor(monitor)),
  );
}