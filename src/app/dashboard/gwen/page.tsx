import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { getPendingTasksForUser } from "@/services/approval.service";
import { getTimesheetsForGwen } from "@/services/timesheet.service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { UserRole, TimesheetStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export default async function GwenDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== UserRole.GWEN) redirect("/dashboard");

  const [pendingTasks, allTimesheets] = await Promise.all([
    getPendingTasksForUser(session.user.id, session.user.role),
    getTimesheetsForGwen(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Approval Queue</h1>
        <p className="mt-1 text-sm text-gray-500">Timesheets that require your review</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard title="Awaiting Review" value={pendingTasks.length}
          className={pendingTasks.length > 0 ? "border-primary-200 bg-primary-50" : ""} />
        <StatsCard title="Total Reviewed" value={allTimesheets.length} />
        <StatsCard title="Approved" value={allTimesheets.filter(t => ["APPROVED", "FINALIZED"].includes(t.status)).length} />
      </div>

      {pendingTasks.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Pending Your Approval</h2>
          <div className="space-y-3">
            {pendingTasks.map((task: any) => (
              <div key={task.id} className="rounded-lg border border-primary-200 bg-primary-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{task.timesheet.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(task.timesheet.weekStartDate)} – {formatDate(task.timesheet.weekEndDate)} · {task.timesheet.totalHours}h total
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Manager already approved</p>
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
        <h2 className="mb-3 text-base font-semibold text-gray-900">All Timesheets in Your Queue</h2>
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
              {allTimesheets.length === 0
                ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No timesheets in your queue</td></tr>
                : allTimesheets.map((ts) => (
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
