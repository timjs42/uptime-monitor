import { runMonitorChecks } from "@/lib/monitoring/run-monitor-checks";

export async function POST(request: Request) {
  const monitoringSecret = process.env.MONITORING_SECRET;

  if (!monitoringSecret) {
    console.error("MONITORING_SECRET is not configured");

    return Response.json(
      {
        error: "Server configuration error",
      },
      {
        status: 500,
      },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${monitoringSecret}`) {
    return Response.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const results = await runMonitorChecks();

    const succeeded = results.filter(
      (result) => result.persisted,
    ).length;

    const failed = results.length - succeeded;

    return Response.json({
      checked: results.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    console.error("Monitoring run failed:", error);

    return Response.json(
      {
        error: "Monitoring run failed",
      },
      {
        status: 500,
      },
    );
  }
}