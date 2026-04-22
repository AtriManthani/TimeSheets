"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewChat } from "./interview-chat";
import { SignaturePad } from "./signature-pad";
import { format } from "date-fns";

type Entry = {
  date: Date;
  dayOfWeek: string;
  regularHours: number;
  overtimeHours: number;
  sickHours: number;
  vacationHours: number;
  personalHolidayHours: number;
  holidayHours: number;
  fmlaHours: number;
  compTimeEarned: number;
  compTimeUsed: number;
  parentalLeaveHours: number;
  preParlLeaveHours: number;
  otReason: string | null;
  notes: string | null;
  totalHours: number;
};

type Timesheet = {
  id: string;
  status: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  notes: string | null;
  signatureData: string | null;
  submittedAt: Date | null;
  entries: Entry[];
};

type Step = "interview" | "review" | "sign" | "done";

function statusToStep(status: string): Step {
  if (status === "SUBMITTED") return "done";
  if (status === "SIGNED") return "sign";
  if (status === "GENERATED") return "review";
  return "interview";
}

const HOUR_FIELDS: { key: keyof Entry; label: string }[] = [
  { key: "regularHours", label: "Regular" },
  { key: "overtimeHours", label: "Overtime" },
  { key: "sickHours", label: "Sick" },
  { key: "vacationHours", label: "Vacation" },
  { key: "personalHolidayHours", label: "Personal" },
  { key: "holidayHours", label: "Holiday" },
  { key: "fmlaHours", label: "FMLA" },
  { key: "compTimeEarned", label: "Comp Earned" },
  { key: "compTimeUsed", label: "Comp Used" },
  { key: "parentalLeaveHours", label: "Parental" },
  { key: "preParlLeaveHours", label: "Pre-Parl" },
];

const steps: Step[] = ["interview", "review", "sign", "done"];
const stepLabels = ["Interview", "Review", "Sign", "Submitted"];

export function TimesheetFlow({ timesheet }: { timesheet: Timesheet }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(statusToStep(timesheet.status));
  const [signatureData, setSignatureData] = useState<string | null>(
    timesheet.signatureData ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentEntries = timesheet.entries;

  async function handleSubmit() {
    if (!signatureData) {
      setError("Please draw your signature before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheet.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed");
        return;
      }
      setStep("done");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = steps.indexOf(step);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Timesheet:{" "}
          {format(new Date(timesheet.weekStartDate), "MMM d")} –{" "}
          {format(new Date(timesheet.weekEndDate), "MMM d, yyyy")}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                i < stepIndex
                  ? "bg-primary-600 text-white"
                  : i === stepIndex
                  ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < stepIndex ? "✓" : i + 1}
            </div>
            <span
              className={`ml-1.5 text-xs ${
                i === stepIndex ? "font-medium text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <div className="mx-3 h-px w-8 bg-gray-200" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "interview" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <InterviewChat
            timesheetId={timesheet.id}
            onGenerated={() => setStep("review")}
          />
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left sticky left-0 bg-gray-50">Day</th>
                    {HOUR_FIELDS.map((f) => (
                      <th key={f.key} className="px-3 py-2 text-right whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold">Total</th>
                    <th className="px-3 py-2 text-left">OT Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentEntries.map((e) => (
                    <tr key={String(e.date)} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-white whitespace-nowrap">
                        {e.dayOfWeek}
                        <span className="block text-gray-400 text-xs font-normal">
                          {format(new Date(e.date), "MMM d")}
                        </span>
                      </td>
                      {HOUR_FIELDS.map((f) => (
                        <td key={f.key} className="px-3 py-2 text-right">
                          {(e[f.key] as number) > 0 ? e[f.key] as number : "–"}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-medium">{e.totalHours}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{e.otReason ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50 font-medium">
                  <tr>
                    <td className="px-3 py-2 sticky left-0 bg-gray-50">Totals</td>
                    {HOUR_FIELDS.map((f) => (
                      <td key={f.key} className="px-3 py-2 text-right">
                        {currentEntries.reduce((s, e) => s + (e[f.key] as number), 0) || "–"}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">{timesheet.totalHours}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          {timesheet.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <span className="font-medium">Notes: </span>{timesheet.notes}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setStep("sign")}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Looks good — add signature →
            </button>
          </div>
        </div>
      )}

      {step === "sign" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Sign your timesheet</h2>
            <p className="text-sm text-gray-500 mt-1">
              By signing, you certify that the hours reported are accurate.
            </p>
          </div>
          <SignaturePad
            onSave={setSignatureData}
            existing={signatureData}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("review")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              ← Back to review
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !signatureData}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit timesheet"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-semibold text-gray-900">Timesheet submitted!</h2>
          <p className="text-sm text-gray-600">
            Your timesheet has been sent to your manager and HR lead via email.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
