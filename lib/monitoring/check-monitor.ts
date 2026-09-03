const MONITOR_TIMEOUT_MS = 10_000;

export type MonitorCheckResult = {
  statusCode: number | null;
  responseTimeMs: number;
  isUp: boolean;
  errorMessage: string | null;
};

export async function checkMonitor(
  url: string,
): Promise<MonitorCheckResult> {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(MONITOR_TIMEOUT_MS),
    });

    const responseTimeMs = Math.round(performance.now() - startedAt);

    const isUp = response.status >= 200 && response.status < 400;

    await response.body?.cancel().catch(() => undefined);

    return {
      statusCode: response.status,
      responseTimeMs,
      isUp,
      errorMessage: isUp ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTimeMs = Math.round(performance.now() - startedAt);

    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        statusCode: null,
        responseTimeMs,
        isUp: false,
        errorMessage: "Request timed out",
      };
    }

    return {
      statusCode: null,
      responseTimeMs,
      isUp: false,
      errorMessage:
        error instanceof Error ? error.message : "Unknown request error",
    };
  }
}