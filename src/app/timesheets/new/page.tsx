"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewChat } from "@/components/timesheets/interview-chat";

function getMonday(dateStr: string): Date {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getSunday(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);
  return toISODate(sun);
}

function getDefaultMonday(): string {
  const today = new Date();
  return toISODate(getMonday(toISODate(today)));
}

export default function NewTimesheetPage() {
  const [step, setStep] = useState<"select-week" | "interview">("select-week");
  const [weekStart, setWeekStart] = useState(getDefaultMonday);
  const [timesheetId, setTimesheetId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekEnd = getSunday(new Date(weekStart + "T12:00:00"));

  async function createTimesheet() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: weekStart, weekEndDate: weekEnd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create timesheet");
        return;
      }
      setTimesheetId(data.timesheet.id);
      setStep("interview");
    } catch {
      setError("Failed to create timesheet. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  if (step === "interview" && timesheetId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Timesheet Interview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Week of <strong>{weekStart}</strong> → <strong>{weekEnd}</strong>
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>AI-Guided Timesheet Entry</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Answer the questions below and the AI will generate your timesheet draft.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <InterviewChat timesheetId={timesheetId} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">New Timesheet</h1>
        <p className="mt-1 text-sm text-gray-500">Select the week you are submitting for.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input
            id="weekStart"
            label="Week Starting (Monday)"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
          <div className="rounded-md bg-gray-50 border border-gray-100 p-3 text-sm text-gray-600">
            <span className="font-medium">Week:</span> {weekStart} → {weekEnd}
          </div>
          <Button onClick={createTimesheet} loading={creating} className="w-full">
            Start Timesheet Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
