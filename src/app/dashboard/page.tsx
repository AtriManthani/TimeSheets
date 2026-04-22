import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { getTimesheetsForUser } from "@/services/timesheet.service";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

function getWeekOptions() {
  const today = new Date();
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const start = startOfWeek(subWeeks(today, i), { weekStartsOn: 0 });
    const end = endOfWeek(start, { weekStartsOn: 0 });
    weeks.push({ start, end, isCurrent: i === 0 });
  }
  return weeks;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const timesheets = await getTimesheetsForUser(session.user.id);
  const weeks = getWeekOptions();

  const submittedIds = new Set(timesheets.map((t) => format(new Date(t.weekStartDate), "yyyy-MM-dd")));
  const submitted = timesheets.filter((t) => t.status === "SUBMITTED");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {session.user.username}
        </p>
      </div>

      {/* Submit Time Reports */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">Submit Time Reports</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {weeks.map(({ start, end, isCurrent }) => {
            const key = format(start, "yyyy-MM-dd");
            const existing = timesheets.find(
              (t) => format(new Date(t.weekStartDate), "yyyy-MM-dd") === key
            );
            const isSubmitted = existing?.status === "SUBMITTED";

            return (
              <div
                key={key}
                className={`rounded-xl border p-4 flex items-center justify-between ${
                  isCurrent
                    ? "border-primary-300 bg-primary-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                  </p>
                  {isCurrent && (
                    <span className="text-xs text-primary-600 font-medium">Current week</span>
                  )}
                  {existing && !isCurrent && (
                    <StatusBadge status={existing.status as any} />
                  )}
                </div>

                {isSubmitted ? (
                  <Link
                    href={`/timesheets/${existing!.id}`}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    View
                  </Link>
                ) : existing ? (
                  <Link
                    href={`/timesheets/${existing.id}`}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    Continue
                  </Link>
                ) : (
                  <Link
                    href={`/timesheets/new?week=${key}`}
                    className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                  >
                    Start
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Submitted Time Reports */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Submitted Time Reports</h2>
          <Link href="/timesheets" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>

        {submitted.length === 0 ? (
          <p className="text-sm text-gray-400">No submitted timesheets yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Week</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submitted.slice(0, 5).map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {formatDate(ts.weekStartDate)} – {formatDate(ts.weekEndDate)}
                    </td>
                    <td className="px-4 py-2 text-right">{ts.totalHours}h</td>
                    <td className="px-4 py-2 text-gray-500">
                      {ts.submittedAt ? formatDate(ts.submittedAt) : "–"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/timesheets/${ts.id}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
