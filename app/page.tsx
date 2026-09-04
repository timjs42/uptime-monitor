import {
  getDashboardMonitors,
  type DashboardMonitor,
  type UptimeHistoryBucket,
} from "@/lib/database/dashboard";

export const dynamic = "force-dynamic";

function formatUptime(uptime: number | null) {
  if (uptime === null) {
    return "—";
  }

  return `${uptime.toFixed(2)}%`;
}

function formatLastChecked(checkedAt: string | null) {
  if (!checkedAt) {
    return "Never";
  }

  const differenceMs =
    Date.now() - new Date(checkedAt).getTime();

  const minutes = Math.floor(
    differenceMs / 60_000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes === 1) {
    return "1 minute ago";
  }

  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours === 1) {
    return "1 hour ago";
  }

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

function getOverallStatus(
  monitors: DashboardMonitor[],
): DashboardMonitor["status"] {
  if (monitors.length === 0) {
    return "unknown";
  }

  if (
    monitors.some(
      (monitor) => monitor.status === "down",
    )
  ) {
    return "down";
  }

  if (
    monitors.some(
      (monitor) => monitor.status === "unknown",
    )
  ) {
    return "unknown";
  }

  return "up";
}

function StatusIndicator({
  status,
}: {
  status: DashboardMonitor["status"];
}) {
  const label =
    status === "up"
      ? "Operational"
      : status === "down"
        ? "Down"
        : "Unknown";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === "up"
            ? "bg-emerald-500"
            : status === "down"
              ? "bg-red-500"
              : "bg-zinc-400"
        }`}
      />

      <span className="text-sm font-medium text-zinc-700">
        {label}
      </span>
    </div>
  );
}

function UptimeHistory({
  history,
}: {
  history: UptimeHistoryBucket[];
}) {
  const downBuckets = history.filter(
    (bucket) => bucket.status === "down",
  ).length;

  const unknownBuckets = history.filter(
    (bucket) => bucket.status === "unknown",
  ).length;

  const description =
    downBuckets > 0
      ? `${downBuckets} intervals contained downtime during the last 24 hours.`
      : unknownBuckets === history.length
        ? "No monitoring data recorded during the last 24 hours."
        : "No downtime recorded during available monitoring data.";

  return (
    <div className="mt-8 border-t border-zinc-100 pt-6">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Last 24 hours
        </span>

        <span className="text-xs text-zinc-400">
          {description}
        </span>
      </div>

      <div
        className="flex h-8 gap-0.5"
        role="img"
        aria-label={description}
      >
        {history.map((bucket, index) => {
          const label =
            bucket.status === "up"
              ? "Operational"
              : bucket.status === "down"
                ? "Downtime recorded"
                : "No data";

          return (
            <div
              key={index}
              title={`${label} · ${bucket.checkCount} checks`}
              className={`min-w-0 flex-1 rounded-sm ${
                bucket.status === "up"
                  ? "bg-emerald-500"
                  : bucket.status === "down"
                    ? "bg-red-500"
                    : "bg-zinc-200"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const monitors = await getDashboardMonitors();

  const overallStatus =
    getOverallStatus(monitors);

  const overallLabel =
    overallStatus === "up"
      ? "All systems operational"
      : overallStatus === "down"
        ? "Some systems are experiencing issues"
        : "Monitoring status unavailable";

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <header className="mb-12">
          <p className="mb-3 text-sm font-medium text-zinc-500">
            System Status
          </p>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Uptime Monitor
              </h1>

              <p className="mt-3 max-w-xl text-zinc-600">
                Live availability and response metrics
                for monitored services.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  overallStatus === "up"
                    ? "bg-emerald-500"
                    : overallStatus === "down"
                      ? "bg-red-500"
                      : "bg-zinc-400"
                }`}
              />

              <span className="text-sm font-medium text-zinc-700">
                {overallLabel}
              </span>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {monitors.length === 0 ? (
            <div className="p-8">
              <p className="text-sm text-zinc-600">
                No active monitors configured.
              </p>
            </div>
          ) : (
            monitors.map((monitor, index) => (
              <article
                key={monitor.id}
                className={`p-6 sm:p-8 ${
                  index !== monitors.length - 1
                    ? "border-b border-zinc-200"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {monitor.name}
                    </h2>

                    <a
                      href={monitor.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm text-zinc-500 transition hover:text-zinc-900"
                    >
                      {monitor.url}
                    </a>
                  </div>

                  <StatusIndicator
                    status={monitor.status}
                  />
                </div>

                <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-zinc-100 pt-6 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Uptime · 24h
                    </dt>

                    <dd className="mt-2 text-lg font-semibold">
                      {formatUptime(
                        monitor.uptime24h,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Response
                    </dt>

                    <dd className="mt-2 text-lg font-semibold">
                      {monitor.responseTimeMs !== null
                        ? `${monitor.responseTimeMs} ms`
                        : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      HTTP
                    </dt>

                    <dd className="mt-2 text-lg font-semibold">
                      {monitor.statusCode ?? "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Last checked
                    </dt>

                    <dd className="mt-2 text-sm font-medium text-zinc-700">
                      {formatLastChecked(
                        monitor.checkedAt,
                      )}
                    </dd>
                  </div>
                </dl>

                <UptimeHistory
                  history={monitor.history24h}
                />
              </article>
            ))
          )}
        </section>

        <footer className="mt-6 flex flex-col gap-2 text-xs text-zinc-400 sm:flex-row sm:justify-between">
          <span>
            Checks run every 5 minutes.
          </span>

          <span>
            24-hour uptime based on recorded
            checks.
          </span>
        </footer>
      </div>
    </main>
  );
}