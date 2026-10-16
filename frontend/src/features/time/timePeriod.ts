import type { ISODate } from "../../types/domain";
import { addDays, startOfMonth, startOfWeek } from "../../utils/date";
import { endOfMonth } from "./timeFormat";

// The periods of "Mine løntimer"
export type HoursPeriod = "week" | "month";

export function periodRange(period: HoursPeriod, anchor: ISODate): { from: ISODate; to: ISODate } {
    if (period === "week") {
        const from = startOfWeek(anchor);
        return { from, to: addDays(from, 6) };
    }
    return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}
