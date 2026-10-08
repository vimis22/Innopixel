import type { ISODate } from "../types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

// Parses "YYYY-MM-DD" as a local calendar date (new Date("YYYY-MM-DD") would be UTC midnight)
export function parseDate(value: ISODate): Date {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function toISODate(date: Date): ISODate {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function todayISO(): ISODate {
    return toISODate(new Date());
}

export function addDays(value: ISODate, days: number): ISODate {
    const date = parseDate(value);
    date.setDate(date.getDate() + days);
    return toISODate(date);
}

// Whole calendar days from a to b (b - a). Rounding absorbs daylight saving shifts.
export function diffDays(a: ISODate, b: ISODate): number {
    return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / DAY_MS);
}

export function isValidISODate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return toISODate(parseDate(value)) === value;
}

export function minDate(values: ISODate[]): ISODate | null {
    return values.length ? values.reduce((a, b) => (a < b ? a : b)) : null;
}

export function maxDate(values: ISODate[]): ISODate | null {
    return values.length ? values.reduce((a, b) => (a > b ? a : b)) : null;
}

export function startOfWeek(value: ISODate): ISODate {
    return addDays(value, -((parseDate(value).getDay() + 6) % 7));
}

export function startOfMonth(value: ISODate): ISODate {
    return `${value.slice(0, 7)}-01`;
}

// ISO 8601 week number (the week numbering used in Denmark)
export function isoWeek(value: ISODate): number {
    const date = parseDate(value);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const firstThursday = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

export function isWeekend(value: ISODate): boolean {
    const day = parseDate(value).getDay();
    return day === 0 || day === 6;
}

const shortFormat = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("da-DK", { weekday: "long" });
const dayMonthYearFormat = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "long", year: "numeric" });
const monthShortFormat = new Intl.DateTimeFormat("da-DK", { month: "short" });
const longFormat = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("da-DK", { month: "long", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function formatDate(value: ISODate, withYear = true): string {
    return (withYear ? longFormat : shortFormat).format(parseDate(value));
}

// "Torsdag d. 24. april 2025"
export function formatLongDate(value: ISODate): string {
    const date = parseDate(value);
    const weekday = weekdayFormat.format(date);
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} d. ${dayMonthYearFormat.format(date)}`;
}

// "apr." for date blocks
export function formatMonthShort(value: ISODate): string {
    return monthShortFormat.format(parseDate(value));
}

export function formatMonth(value: ISODate): string {
    return monthFormat.format(parseDate(value));
}

export function formatDateTime(value: string): string {
    return dateTimeFormat.format(new Date(value));
}

// "i dag", "i morgen", "om 5 dage", "for 3 dage siden"
export function formatRelativeDays(value: ISODate, today: ISODate = todayISO()): string {
    const days = diffDays(today, value);
    if (days === 0) return "i dag";
    if (days === 1) return "i morgen";
    if (days === -1) return "i går";
    return days > 0 ? `om ${days} dage` : `for ${-days} dage siden`;
}

export function formatTimeAgo(value: string): string {
    const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
    if (minutes < 1) return "lige nu";
    if (minutes < 60) return `for ${minutes} min. siden`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `for ${hours} t. siden`;
    const days = Math.round(hours / 24);
    if (days < 30) return `for ${days} d. siden`;
    return formatDateTime(value);
}
