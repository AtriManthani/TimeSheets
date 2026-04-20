import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy HH:mm");
}

export function getWeekRange(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });   // Sunday
  return { start, end };
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function getDayName(date: Date): string {
  return format(date, "EEEE");
}

export function calculateTotalHours(entries: {
  regularHours: number;
  overtimeHours: number;
  sickHours: number;
  vacationHours: number;
  personalHolidayHours: number;
  holidayHours: number;
  fmlaHours: number;
  compTimeUsed: number;
  parentalLeaveHours: number;
}): number {
  return (
    entries.regularHours +
    entries.overtimeHours +
    entries.sickHours +
    entries.vacationHours +
    entries.personalHolidayHours +
    entries.holidayHours +
    entries.fmlaHours +
    entries.compTimeUsed +
    entries.parentalLeaveHours
  );
}

export function safeJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val as T;
  try {
    return JSON.parse(val as string) as T;
  } catch {
    return fallback;
  }
}
