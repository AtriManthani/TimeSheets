type TimesheetEntry = {
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
  weekStartDate: Date;
  weekEndDate: Date;
  month: number;
  year: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  notes: string | null;
  signatureData: string | null;
  submittedAt: Date | null;
  entries: TimesheetEntry[];
};

type UserProfile = {
  firstName: string;
  lastName: string;
  designation: string;
  managerFirstName: string;
  managerLastName: string;
  managerEmail: string;
  managerRole: string;
  hrLeadEmail: string;
  department: string;
  specificDepartment: string;
};

type User = {
  username: string;
};

export async function callPowerAutomate(
  timesheet: Timesheet,
  user: User,
  profile: UserProfile
): Promise<void> {
  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[powerautomate] POWER_AUTOMATE_WEBHOOK_URL not set — skipping webhook");
    return;
  }

  const payload = {
    submittedAt: timesheet.submittedAt?.toISOString() ?? new Date().toISOString(),
    employee: {
      username: user.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      designation: profile.designation,
      department: profile.department,
      specificDepartment: profile.specificDepartment,
    },
    manager: {
      firstName: profile.managerFirstName,
      lastName: profile.managerLastName,
      email: profile.managerEmail,
      role: profile.managerRole,
    },
    hrLead: { email: profile.hrLeadEmail },
    timesheet: {
      id: timesheet.id,
      weekStartDate: timesheet.weekStartDate.toISOString().split("T")[0],
      weekEndDate: timesheet.weekEndDate.toISOString().split("T")[0],
      month: timesheet.month,
      year: timesheet.year,
      totalHours: timesheet.totalHours,
      regularHours: timesheet.regularHours,
      overtimeHours: timesheet.overtimeHours,
      notes: timesheet.notes,
      signatureDataUrl: timesheet.signatureData,
      entries: timesheet.entries.map((e) => ({
        date: e.date.toISOString().split("T")[0],
        dayOfWeek: e.dayOfWeek,
        regularHours: e.regularHours,
        overtimeHours: e.overtimeHours,
        sickHours: e.sickHours,
        vacationHours: e.vacationHours,
        personalHolidayHours: e.personalHolidayHours,
        holidayHours: e.holidayHours,
        fmlaHours: e.fmlaHours,
        compTimeEarned: e.compTimeEarned,
        compTimeUsed: e.compTimeUsed,
        parentalLeaveHours: e.parentalLeaveHours,
        preParlLeaveHours: e.preParlLeaveHours,
        otReason: e.otReason,
        notes: e.notes,
        totalHours: e.totalHours,
      })),
    },
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Power Automate webhook failed: ${res.status} ${text}`);
  }
}
