import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { getTimesheetsForManager } from "@/services/timesheet.service";
import { getPendingTasksForUser } from "@/services/approval.service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { UserRole, TimesheetStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export default async function ManagerDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== UserRole.MANAGER) redirect("/dashboard");

  const [timesheets, pendingTasks] = await Promise.all([
    getTimesheetsForManager(session.user.id),
    getPendingTasksForUser(session.user.id, session.user.role),
  ]);

  const awaitingCount = pendingTasks.length;
  const approvedCount = timesheets.filter((t) =>
    ["APPROVED", "FINALIZED", "MANAGER_APPROVED"].includes(t.status)
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Team Timesheets</h1>
        <p className="mt-1 text-sm text-gray-500">Timesheets from your direct reports</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard title="Total Submitted" value={timesheets.length} />
        <StatsCard title="Awaiting Your Review" value={awaitingCount}
          className={awaitingCount > 0 ? "border-primary-200 bg-primary-50" : ""} />
        <StatsCard title="Approved" value={approvedCount} />
      </div>

      {pendingTasks.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Needs Your Review</h2>
          <div className="space-y-3">
            {pendingTasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4">
                <div>
                  <p className="text-sm font-medium">{task.timesheet.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(task.timesheet.weekStartDate)} – {formatDate(task.timesheet.weekEndDate)} · {task.timesheet.totalHours}h
                  </p>
                </div>
                <Link href={`/timesheets/${task.timesheet.id}`}>
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">All Team Timesheets</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Week</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timesheets.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No timesheets yet</td></tr>
              ) : timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{(ts as any).user?.name}</td>
                  <td className="px-4 py-3">{formatDate(ts.weekStartDate)} – {formatDate(ts.weekEndDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={ts.status as TimesheetStatus} /></td>
                  <td className="px-4 py-3 text-right">{ts.totalHours}h</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/timesheets/${ts.id}`} className="text-primary-600 hover:underline text-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
