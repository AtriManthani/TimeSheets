import { redirect } from "next/navigation";
import { getSession, canViewOrgWideData, EXECUTIVE_ROLES } from "@/lib/auth";
import Link from "next/link";
import { getOrgTimesheets } from "@/services/timesheet.service";
import { listUsers } from "@/services/user.service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { TimesheetStatus } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";

export default async function ExecutiveDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!canViewOrgWideData(session.user.role)) redirect("/dashboard");

  const [timesheets, users] = await Promise.all([
    getOrgTimesheets(),
    listUsers(session.user.role),
  ]);

  const byStatus = timesheets.reduce<Record<string, number>>((acc, ts) => {
    acc[ts.status] = (acc[ts.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Organization Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Full visibility across all departments · {ROLE_LABELS[session.user.role]}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Employees" value={users.length} />
        <StatsCard title="Total Timesheets" value={timesheets.length} />
        <StatsCard title="Pending Approval" value={(byStatus["SUBMITTED"] ?? 0) + (byStatus["UNDER_REVIEW"] ?? 0) + (byStatus["MANAGER_APPROVED"] ?? 0)} />
        <StatsCard title="Fully Approved" value={(byStatus["APPROVED"] ?? 0) + (byStatus["FINALIZED"] ?? 0)} />
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">All Timesheets</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Week</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timesheets.length === 0
                ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No timesheets found</td></tr>
                : timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{(ts as any).user?.name}</td>
                    <td className="px-4 py-2 text-gray-500">{ROLE_LABELS[(ts as any).user?.role]}</td>
                    <td className="px-4 py-2">{formatDate(ts.weekStartDate)} – {formatDate(ts.weekEndDate)}</td>
                    <td className="px-4 py-2"><StatusBadge status={ts.status as TimesheetStatus} /></td>
                    <td className="px-4 py-2 text-right">{ts.totalHours}h</td>
                    <td className="px-4 py-2 text-gray-500">{ts.submittedAt ? formatDate(ts.submittedAt) : "–"}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/timesheets/${ts.id}`} className="text-primary-600 hover:underline text-xs">View</Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">All Employees</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2 text-gray-500">{u.email}</td>
                  <td className="px-4 py-2">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-2 text-gray-500">{(u as any).profile?.department ?? "–"}</td>
                  <td className="px-4 py-2 text-gray-500">{(u as any).managerOf?.manager?.name ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/audit" className="text-sm text-primary-600 hover:underline">
          View Audit Logs →
        </Link>
      </div>
    </div>
  );
}
