import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTimesheetById } from "@/services/timesheet.service";
import { getPendingTasksForUser } from "@/services/approval.service";
import { TimesheetDetail } from "@/components/timesheets/timesheet-detail";
import Link from "next/link";

export default async function TimesheetPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let timesheet;
  try {
    timesheet = await getTimesheetById(params.id, session.user.id, session.user.role);
  } catch (err: any) {
    if (err.message === "FORBIDDEN") redirect("/dashboard");
    throw err;
  }

  if (!timesheet) notFound();

  const isOwner = timesheet.userId === session.user.id;
  const pendingTasks = await getPendingTasksForUser(session.user.id, session.user.role);
  const myTask = pendingTasks.find((t: any) => t.timesheetId === params.id);

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to Dashboard
      </Link>
      <TimesheetDetail timesheet={timesheet} isOwner={isOwner} pendingTask={myTask} />
    </div>
  );
}
