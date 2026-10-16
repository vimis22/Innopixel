import { describe, expect, it } from "vitest";
import type { TimeRegistration } from "../../types/time";
import {
    danishDate, endOfMonth, formatClock, formatDuration, formatHours, formWorkedMinutes, liveWorkedSeconds, numericDate, shiftMonth, spanMinutes, toCsv, weekdayIndex,
} from "./timeFormat";

function registration(patch: Partial<TimeRegistration>): TimeRegistration {
    return {
        id: "1", userId: "1", date: "2026-11-18", clockIn: "2026-11-18T07:00:00Z", clockOut: null, breakMinutes: 0,
        workedMinutes: 0, projectId: null, projectName: null, remarks: null, status: "ACTIVE", onBreak: false, breaks: [], ...patch,
    };
}

describe("time formatting", () => {
    it("shows hours with a Danish decimal comma", () => {
        expect(formatHours(390)).toBe("6,50");
        expect(formatHours(2250)).toBe("37,50");
        expect(formatHours(0)).toBe("0,00");
    });

    it("shows timestamps in Danish time, in summer and winter", () => {
        expect(formatClock("2026-06-15T06:15:00Z")).toBe("08:15");
        expect(formatClock("2026-12-15T07:15:00Z")).toBe("08:15");
        expect(danishDate("2026-06-15T23:30:00Z")).toBe("2026-06-16");
    });

    it("handles calendar dates without the browser's time zone", () => {
        expect(numericDate("2026-05-04")).toBe("04.05.2026");
        expect(weekdayIndex("2026-11-16")).toBe(0);
        expect(weekdayIndex("2026-11-22")).toBe(6);
        expect(shiftMonth("2026-12-15", 1)).toBe("2027-01-01");
        expect(shiftMonth("2026-01-31", -1)).toBe("2025-12-01");
        expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
    });

    it("formats the live clock", () => {
        expect(formatDuration(4 * 3600 + 12 * 60 + 37)).toBe("04:12:37");
        expect(formatDuration(-5)).toBe("00:00:00");
    });
});

describe("time calculations", () => {
    it("counts a live registration until now, without breaks", () => {
        const now = Date.parse("2026-11-18T10:20:00Z");
        const live = registration({
            breaks: [
                { id: "b1", startAt: "2026-11-18T09:00:00Z", endAt: "2026-11-18T09:15:00Z" },
                { id: "b2", startAt: "2026-11-18T10:00:00Z", endAt: null },
            ],
        });
        expect(liveWorkedSeconds(live, now)).toBe((3 * 60 + 20 - 35) * 60);
        expect(liveWorkedSeconds(registration({ clockOut: "2026-11-18T15:00:00Z", workedMinutes: 450 }), now)).toBe(450 * 60);
    });

    it("puts an earlier clock-out on the next day, like the backend", () => {
        expect(spanMinutes("08:00", "16:00")).toBe(480);
        expect(spanMinutes("22:00", "06:00")).toBe(480);
        expect(spanMinutes("08:00", "08:00")).toBe(24 * 60);
        expect(spanMinutes("8:00", "16:00")).toBeNull();
    });

    it("rejects breaks that are negative or as long as the shift", () => {
        expect(formWorkedMinutes("08:15", "16:00", 30)).toBe(435);
        expect(formWorkedMinutes("08:00", "09:00", 60)).toBeNull();
        expect(formWorkedMinutes("08:00", "09:00", -1)).toBeNull();
        expect(formWorkedMinutes("08:00", "25:00", 0)).toBeNull();
    });

    it("escapes CSV fields", () => {
        expect(toCsv([["Dato", "Bemærkning"], ["2026-11-18", 'Sagde "hej"; gik']])).toBe('﻿Dato;Bemærkning\r\n2026-11-18;"Sagde ""hej""; gik"');
    });
});
