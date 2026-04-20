"use client";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { TimesheetStatus } from "@prisma/client";

export function TimesheetList({ timesheets }: { timesheets: any[] }) {
  if (timesheets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No timesheets yet.</p>
        <Link href="/timesheets/new" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          Create your first timesheet
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Week</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Total Hours</th>
            <th className="px-4 py-3 text-left">Submitted</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {timesheets.map((ts) => (
            <tr key={ts.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                {formatDate(ts.weekStartDate)} – {formatDate(ts.weekEndDate)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ts.status as TimesheetStatus} />
              </td>
              <td className="px-4 py-3 text-right">{ts.totalHours}h</td>
              <td className="px-4 py-3 text-gray-500">
                {ts.submittedAt ? formatDate(ts.submittedAt) : "–"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/timesheets/${ts.id}`}
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
