import { describe, expect, it } from "vitest";
import type { TimeRegistration } from "../../types/time";
import { daysBetween, isWorkday, minutesByProject, missingWorkdays, plannedMinutes, plannedMinutesIn } from "./timePlan";

// 2026-11-16 is a Monday
const reg = (date: string, workedMinutes: number, projectName: string | null = null) =>
    ({ id: date + workedMinutes, date, workedMinutes, projectName }) as TimeRegistration;

describe("planned time (as the backend's TimeCalculations)", () => {
    it("spreads the weekly hours over Monday–Friday", () => {
        expect(plannedMinutes("2026-11-16", 37)).toBe(444);   // 37 × 60 / 5
        expect(plannedMinutes("2026-11-21", 37)).toBe(0);     // Saturday
        expect(plannedMinutes("2026-11-22", 37)).toBe(0);     // Sunday
        expect(plannedMinutesIn("2026-11-16", "2026-11-22", 37)).toBe(37 * 60);
    });

    it("rounds half minutes like the server", () => {
        expect(plannedMinutes("2026-11-16", 37.5)).toBe(450);
        expect(plannedMinutes("2026-11-16", 0)).toBe(0);
    });

    it("knows weekdays across month and year boundaries", () => {
        expect(isWorkday("2026-12-31")).toBe(true);           // Thursday
        expect(isWorkday("2027-01-02")).toBe(false);          // Saturday
        expect(daysBetween("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
        expect(daysBetween("2026-12-02", "2026-12-01")).toEqual([]);
    });
});

describe("missingWorkdays", () => {
    it("lists workdays without any registration and ignores weekends", () => {
        const registrations = [reg("2026-11-16", 400), reg("2026-11-18", 300)];
        expect(missingWorkdays("2026-11-16", "2026-11-22", registrations)).toEqual(["2026-11-17", "2026-11-19", "2026-11-20"]);
    });

    it("counts an overnight shift on the day it started", () => {
        // A 22:00–06:00 shift is registered on the 19th only; the 20th is still missing
        expect(missingWorkdays("2026-11-19", "2026-11-20", [reg("2026-11-19", 450)])).toEqual(["2026-11-20"]);
    });

    it("returns nothing for an empty or reversed range", () => {
        expect(missingWorkdays("2026-11-20", "2026-11-19", [])).toEqual([]);
    });
});

describe("minutesByProject", () => {
    it("totals per project, largest first, with a label for time without a project", () => {
        const result = minutesByProject([reg("2026-11-16", 60, "Website"), reg("2026-11-17", 30), reg("2026-11-18", 90, "Website")], "Uden projekt");
        expect(result).toEqual([{ name: "Website", minutes: 150 }, { name: "Uden projekt", minutes: 30 }]);
    });
});
