import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTimesheetsForUser } from "@/services/timesheet.service";
import { TimesheetList } from "@/components/timesheets/timesheet-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TimesheetsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const timesheets = await getTimesheetsForUser(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Timesheets</h1>
          <p className="mt-1 text-sm text-gray-500">{timesheets.length} total records</p>
        </div>
        <Link href="/timesheets/new">
          <Button>+ New Timesheet</Button>
        </Link>
      </div>
      <TimesheetList timesheets={timesheets} />
    </div>
  );
}
