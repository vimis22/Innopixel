import api from "../../services/api";
import type { ISODate } from "../../types/domain";
import type { TeamTime, TimeOverview, TimeRegistration, TimeRegistrationInput, TimeWeek } from "../../types/time";
import { call } from "../workspace/apiErrors";

/*
 * Time registration API (backend/src/Innopixel.Main/Controllers/TimeController.cs).
 * The server takes the user from the login cookie and checks every permission; failures arrive as
 * RepositoryError with a Danish message from da.ts (time.validation.*).
 */

const id = encodeURIComponent;

export const timeApi = {
    overview: () => call(async () => (await api.get<TimeOverview>("/time/overview")).data),

    week: (weekStart: ISODate) => call(async () => (await api.get<TimeWeek>("/time/week", { params: { weekStart } })).data),

    registrations: (from: ISODate, to: ISODate, userId?: string) =>
        call(async () => (await api.get<TimeRegistration[]>("/time/registrations", { params: { from, to, userId } })).data),

    team: (weekStart: ISODate) => call(async () => (await api.get<TeamTime>("/time/team", { params: { weekStart } })).data),

    // Administrators: a colleague's finished registrations awaiting approval, from any date
    pending: (userId: string) => call(async () => (await api.get<TimeRegistration[]>("/time/pending", { params: { userId } })).data),

    clockIn: (projectId: string | null) =>
        call(async () => (await api.post<TimeRegistration>("/time/clock-in", { projectId, remarks: null })).data),
    clockOut: () => call(async () => (await api.post<TimeRegistration>("/time/clock-out")).data),
    startBreak: () => call(async () => (await api.post<TimeRegistration>("/time/breaks/start")).data),
    endBreak: () => call(async () => (await api.post<TimeRegistration>("/time/breaks/end")).data),

    create: (input: TimeRegistrationInput) =>
        call(async () => (await api.post<TimeRegistration>("/time/registrations", input)).data),
    update: (registrationId: string, input: TimeRegistrationInput) =>
        call(async () => (await api.put<TimeRegistration>(`/time/registrations/${id(registrationId)}`, input)).data),
    remove: (registrationId: string) => call(async () => {
        await api.delete(`/time/registrations/${id(registrationId)}`);
    }),
    setApproval: (registrationId: string, approved: boolean) => call(async () => {
        await api.put(`/time/registrations/${id(registrationId)}/approval`, { approved });
    }),
};
