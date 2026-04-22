import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTimesheetsForUser } from "@/services/timesheet.service";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; from?: string; to?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const month = searchParams.month ? parseInt(searchParams.month) : undefined;
  const year = searchParams.year ? parseInt(searchParams.year) : undefined;
  const from = searchParams.from ? new Date(searchParams.from) : undefined;
  const to = searchParams.to ? new Date(searchParams.to) : undefined;

  const timesheets = await getTimesheetsForUser(session.user.id, { month, year, from, to });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Timesheets</h1>
        <p className="mt-1 text-sm text-gray-500">{timesheets.length} records</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
          <select
            name="month"
            defaultValue={searchParams.month ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All months</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
          <select
            name="year"
            defaultValue={searchParams.year ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            name="from"
            defaultValue={searchParams.from ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            name="to"
            defaultValue={searchParams.to ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Filter
        </button>

        {(searchParams.month || searchParams.year || searchParams.from || searchParams.to) && (
          <Link
            href="/timesheets"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {timesheets.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No timesheets found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Week</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {formatDate(ts.weekStartDate)} – {formatDate(ts.weekEndDate)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={ts.status as any} />
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
    </div>
  );
}
