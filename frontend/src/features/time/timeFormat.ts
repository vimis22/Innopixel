import type { ISODate } from "../../types/domain";
import type { TimeRegistration } from "../../types/time";

/*
 * Formatting and small calculations for time registration. Everything the user sees is Danish time
 * (Europe/Copenhagen), no matter which time zone the browser is in.
 */

const TIME_ZONE = "Europe/Copenhagen";

const clockFormat = new Intl.DateTimeFormat("da-DK", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const hoursFormat = new Intl.NumberFormat("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 390 -> "6,50"
export function formatHours(minutes: number): string {
    return hoursFormat.format(minutes / 60);
}

// Difference in minutes as hours with a sign: 90 -> "+1,50", -30 -> "−0,50"
export function formatSigned(minutes: number): string {
    if (minutes === 0) return formatHours(0);
    return `${minutes > 0 ? "+" : "−"}${formatHours(Math.abs(minutes))}`;
}

// ISO timestamp -> "08:15" (Danish time)
export function formatClock(iso: string): string {
    return clockFormat.format(new Date(iso)).replace(".", ":");
}

// "2026-11-18" -> "18.11.2026"
export function numericDate(value: ISODate): string {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
}

// Monday-based weekday index (0 = Monday) of a calendar date
export function weekdayIndex(value: ISODate): number {
    const [year, month, day] = value.split("-").map(Number);
    return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

// First day of the month `offset` months from the month of `value`
export function shiftMonth(value: ISODate, offset: number): ISODate {
    const [year, month] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

// Last day of the month of `value`
export function endOfMonth(value: ISODate): ISODate {
    const [year, month] = value.split("-").map(Number);
    return `${value.slice(0, 7)}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
}

// ISO timestamp -> Danish calendar date "2026-11-18"
export function danishDate(iso: string | Date): ISODate {
    return dateFormat.format(typeof iso === "string" ? new Date(iso) : iso);
}

// 15157 -> "04:12:37"
export function formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

// Worked seconds of a live registration at nowMs: time since clock-in minus all breaks so far
export function liveWorkedSeconds(registration: TimeRegistration, nowMs: number): number {
    const end = registration.clockOut ? Date.parse(registration.clockOut) : nowMs;
    if (registration.clockOut) return registration.workedMinutes * 60;
    const breaks = registration.breaks.reduce((sum, b) => sum + Math.max(0, (b.endAt ? Date.parse(b.endAt) : nowMs) - Date.parse(b.startAt)), 0);
    return Math.max(0, (end - Date.parse(registration.clockIn) - breaks) / 1000);
}

// "HH:mm" -> minutes since midnight, or null
export function parseClock(value: string): number | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

// Minutes between two clock times; a clock-out before (or at) the clock-in is the next day, as in the backend
export function spanMinutes(clockIn: string, clockOut: string): number | null {
    const start = parseClock(clockIn);
    const end = parseClock(clockOut);
    if (start === null || end === null) return null;
    return end > start ? end - start : end + 24 * 60 - start;
}

// Worked minutes for the form, or null when the input can't be a valid registration
export function formWorkedMinutes(clockIn: string, clockOut: string, breakMinutes: number): number | null {
    const span = spanMinutes(clockIn, clockOut);
    if (span === null || !Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes >= span) return null;
    return span - breakMinutes;
}

// CSV for the "Eksporter" button (semicolon-separated, as Danish Excel expects)
export function toCsv(rows: string[][]): string {
    const escape = (value: string) => (/[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    return "﻿" + rows.map((row) => row.map(escape).join(";")).join("\r\n");
}

export function downloadFile(fileName: string, content: string, type = "text/csv;charset=utf-8") {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
