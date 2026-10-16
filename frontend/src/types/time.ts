import type { ISODate, ISODateTime } from "./domain";

// Time registration ("Tidsregistrering"), as returned by /api/time (backend/src/Innopixel.Workspace/Contracts/TimeDtos.cs).
// Timestamps are UTC (shown in Danish time), dates are Danish calendar dates, durations are whole minutes.

export type TimeStatus = "ACTIVE" | "PENDING" | "APPROVED" | "REJECTED";

export interface TimeBreak {
    id: string;
    startAt: ISODateTime;
    endAt: ISODateTime | null;
}

export interface TimeRegistration {
    id: string;
    userId: string;
    date: ISODate;
    clockIn: ISODateTime;
    clockOut: ISODateTime | null;
    breakMinutes: number;
    workedMinutes: number;
    projectId: string | null;
    projectName: string | null;
    remarks: string | null;
    status: TimeStatus;
    onBreak: boolean;
    breaks: TimeBreak[];
}

export interface TimeOverview {
    serverTime: ISODateTime;
    today: ISODate;
    expectedWeeklyHours: number;
    todayMinutes: number;
    todayPlannedMinutes: number;
    weekMinutes: number;
    weekPlannedMinutes: number;
    missingDaysThisMonth: number;
    pendingMinutes: number;
    pendingEmployees: number;
    active: TimeRegistration | null;
    latest: TimeRegistration | null;
}

export interface TimeDay {
    date: ISODate;
    workedMinutes: number;
    plannedMinutes: number;
}

export interface TimeWeek {
    weekStart: ISODate;
    weekEnd: ISODate;
    days: TimeDay[];
}

export type TeamTimeStatus = "ON_TRACK" | "BEHIND" | "MISSING";

export interface TeamMemberTime {
    userId: string;
    name: string;
    title: string;
    workedMinutes: number;
    expectedMinutes: number;
    missingDays: number;
    pendingCount: number;
    pendingMinutes: number;
    status: TeamTimeStatus;
}

export interface TeamTime {
    weekStart: ISODate;
    weekEnd: ISODate;
    members: TeamMemberTime[];
}

// The "Juster løntimer" form. Times are "HH:mm" in Danish time; a clock-out before the clock-in is the next day.
export interface TimeRegistrationInput {
    date: ISODate;
    clockIn: string;
    clockOut: string;
    breakMinutes: number;
    projectId: string | null;
    remarks: string | null;
    userId?: string;
}
