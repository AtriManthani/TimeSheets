import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTimesheetById } from "@/services/timesheet.service";
import { TimesheetFlow } from "@/components/timesheets/timesheet-flow";
import Link from "next/link";

export default async function TimesheetPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let timesheet;
  try {
    timesheet = await getTimesheetById(params.id, session.user.id);
  } catch (err: any) {
    if (err.message === "FORBIDDEN") redirect("/dashboard");
    throw err;
  }

  if (!timesheet) notFound();

  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to Dashboard
      </Link>
      <TimesheetFlow timesheet={timesheet as any} />
    </div>
  );
}
