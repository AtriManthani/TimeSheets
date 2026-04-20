"use client";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface TimesheetDetailProps {
  timesheet: any;
  isOwner: boolean;
  pendingTask?: any;
}

export function TimesheetDetail({ timesheet, isOwner, pendingTask }: TimesheetDetailProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "NEEDS_CORRECTION" | null>(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submitTimesheet() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.refresh();
    } catch { setError("Submission failed."); }
    finally { setSubmitting(false); }
  }

  async function makeDecision() {
    if (!decision || !pendingTask) return;
    setDeciding(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${pendingTask.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comments }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.refresh();
    } catch { setError("Decision failed."); }
    finally { setDeciding(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Timesheet: {formatDate(timesheet.weekStartDate)} – {formatDate(timesheet.weekEndDate)}
          </h1>
          {!isOwner && (
            <p className="mt-1 text-sm text-gray-500">Employee: {timesheet.user?.name}</p>
          )}
        </div>
        <StatusBadge status={timesheet.status} />
      </div>

      {timesheet.correctionComments && (
        <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-medium text-orange-800">Correction requested</p>
          <p className="mt-1 text-sm text-orange-700">{timesheet.correctionComments}</p>
        </div>
      )}

      {/* Entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Day</th>
                  <th className="px-4 py-2 text-right">Regular</th>
                  <th className="px-4 py-2 text-right">OT</th>
                  <th className="px-4 py-2 text-right">Sick</th>
                  <th className="px-4 py-2 text-right">Vacation</th>
                  <th className="px-4 py-2 text-right">Holiday</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timesheet.entries?.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      {entry.dayOfWeek}
                      <span className="ml-1 text-xs text-gray-400">{formatDate(entry.date)}</span>
                    </td>
                    <td className="px-4 py-2 text-right">{entry.regularHours || "–"}</td>
                    <td className="px-4 py-2 text-right">{entry.overtimeHours || "–"}</td>
                    <td className="px-4 py-2 text-right">{entry.sickHours || "–"}</td>
                    <td className="px-4 py-2 text-right">{entry.vacationHours || "–"}</td>
                    <td className="px-4 py-2 text-right">{entry.holidayHours || "–"}</td>
                    <td className="px-4 py-2 text-right font-medium">{entry.totalHours}</td>
                    <td className="px-4 py-2 text-gray-500 max-w-xs truncate">
                      {entry.otReason || entry.notes || "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{timesheet.regularHours}</td>
                  <td className="px-4 py-2 text-right">{timesheet.overtimeHours}</td>
                  <td colSpan={3} />
                  <td className="px-4 py-2 text-right">{timesheet.totalHours}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {timesheet.notes && (
        <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-700">
          <strong>Notes:</strong> {timesheet.notes}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit action (owner) */}
      {isOwner && timesheet.status === "GENERATED" && (
        <Button onClick={submitTimesheet} loading={submitting}>
          Submit for Approval
        </Button>
      )}

      {/* Re-submit action */}
      {isOwner && timesheet.status === "NEEDS_CORRECTION" && (
        <Button onClick={submitTimesheet} loading={submitting}>
          Resubmit Timesheet
        </Button>
      )}

      {/* Approval panel */}
      {pendingTask && ["UNDER_REVIEW", "MANAGER_APPROVED"].includes(timesheet.status) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              {(["APPROVED", "NEEDS_CORRECTION", "REJECTED"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                    decision === d
                      ? d === "APPROVED"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : d === "NEEDS_CORRECTION"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {d === "APPROVED" ? "Approve" : d === "NEEDS_CORRECTION" ? "Request Correction" : "Reject"}
                </button>
              ))}
            </div>
            {decision && decision !== "APPROVED" && (
              <Textarea
                label="Comments (required)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Explain what needs to be corrected..."
              />
            )}
            <Button
              onClick={makeDecision}
              loading={deciding}
              disabled={!decision || (decision !== "APPROVED" && !comments.trim())}
            >
              Submit Decision
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Version history */}
      {timesheet.versions && timesheet.versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Version</th>
                  <th className="px-4 py-2 text-left">Status at Snapshot</th>
                  <th className="px-4 py-2 text-left">Changed by</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timesheet.versions.map((v: any) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2">v{v.versionNumber}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-2">{v.changedBy}</td>
                    <td className="px-4 py-2 text-gray-500">{v.changeReason ?? "–"}</td>
                    <td className="px-4 py-2 text-gray-500">{formatDate(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
