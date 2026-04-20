import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { getUserWithRelations } from "@/services/user.service";
import { getTimesheetsForUser } from "@/services/timesheet.service";
import { getPendingTasksForUser } from "@/services/approval.service";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TimesheetList } from "@/components/timesheets/timesheet-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { TimesheetStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, timesheets, pendingTasks] = await Promise.all([
    getUserWithRelations(session.user.id),
    getTimesheetsForUser(session.user.id),
    getPendingTasksForUser(session.user.id, session.user.role),
  ]);

  const recentTimesheets = timesheets.slice(0, 5);
  const approvedCount = timesheets.filter((t) => t.status === "APPROVED" || t.status === "FINALIZED").length;
  const pendingCount = timesheets.filter((t) =>
    ["SUBMITTED", "UNDER_REVIEW", "RESUBMITTED", "MANAGER_APPROVED"].includes(t.status)
  ).length;
  const correctionCount = timesheets.filter((t) => t.status === "NEEDS_CORRECTION").length;

  return (
    <div className="space-y-8">
      {/* Profile summary */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome, {user?.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.profile?.title} · {user?.profile?.department} ·{" "}
              {ROLE_LABELS[session.user.role]}
            </p>
            {user?.managerOf?.manager && (
              <p className="mt-1 text-sm text-gray-500">
                Reporting to: {user.managerOf.manager.name} ({user.managerOf.manager.email})
              </p>
            )}
            {!user?.profile?.isComplete && (
              <div className="mt-3 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-700">
                Your profile is incomplete.{" "}
                <Link href="/profile" className="font-medium underline">
                  Complete it now
                </Link>
              </div>
            )}
          </div>
          <Link href="/timesheets/new">
            <Button>+ New Timesheet</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Timesheets" value={timesheets.length} />
        <StatsCard title="Approved" value={approvedCount} />
        <StatsCard title="Pending Review" value={pendingCount} />
        <StatsCard
          title="Needs Correction"
          value={correctionCount}
          className={correctionCount > 0 ? "border-orange-200 bg-orange-50" : ""}
        />
      </div>

      {/* Pending approval tasks (for managers/Gwen) */}
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Awaiting Your Approval</h2>
          <div className="space-y-3">
            {pendingTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.timesheet.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Week ending {formatDate(task.timesheet.weekEndDate)} ·{" "}
                    {task.timesheet.totalHours}h total
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

      {/* Recent timesheets */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">My Timesheets</h2>
          {timesheets.length > 5 && (
            <Link href="/timesheets" className="text-sm text-primary-600 hover:underline">
              View all
            </Link>
          )}
        </div>
        <TimesheetList timesheets={recentTimesheets} />
      </div>
    </div>
  );
}
