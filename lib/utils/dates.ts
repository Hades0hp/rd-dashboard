import { addDays, format } from "date-fns";

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getNowISOString(): string {
  return new Date().toISOString();
}

export function calculateEndDate(
  startDate: string,
  durationDays: number,
): string {
  return format(addDays(new Date(startDate), durationDays - 1), "yyyy-MM-dd");
}
