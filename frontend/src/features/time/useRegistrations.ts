import type { ISODate } from "../../types/domain";
import type { TimeRegistration } from "../../types/time";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

export interface RegistrationsByUser {
    key: string;
    from: ISODate;
    to: ISODate;
    byUser: Map<string, TimeRegistration[]>;
}

/*
 * Registrations of several employees for a period (at most 93 days, the server's limit). The API is
 * per employee, so this sends one request each; administrators only (the server answers 403 otherwise).
 */
export function useRegistrationsFor(userIds: string[], from: ISODate, to: ISODate, refresh: number) {
    const key = userIds.join(",");
    const query = useTimeQuery<RegistrationsByUser>(async () => {
        const lists = await Promise.all(userIds.map((id) => timeApi.registrations(from, to, id)));
        return { key, from, to, byUser: new Map(userIds.map((id, i) => [id, lists[i]])) };
    }, [key, from, to, refresh]);
    // Earlier data stays in useTimeQuery while the next request runs; only return data for this request
    const current = query.data && query.data.key === key && query.data.from === from && query.data.to === to ? query.data : null;
    return { data: current, failed: query.failed, retry: query.retry };
}
