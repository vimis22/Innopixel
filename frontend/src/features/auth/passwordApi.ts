import api from "../../services/api";
import { call } from "../workspace/apiErrors";

/*
 * "Glemt adgangskode" and reset links (backend/src/Innopixel.Main/Controllers/AuthController.cs). No login needed.
 * The token comes from the link's #fragment, so it is never part of a URL the server (or a proxy) logs;
 * here it travels in the request body only.
 */

export type ResetLinkPurpose = "RESET" | "INVITE";

export const passwordApi = {
    // Always succeeds for a valid request (202), whether or not the address has an account
    requestReset: (email: string) => call(async () => {
        await api.post("/auth/password/forgot", { email: email.trim() });
    }),

    validateLink: (token: string) =>
        call(async () => (await api.post<{ purpose: ResetLinkPurpose }>("/auth/password/reset/validate", { token })).data.purpose),

    resetPassword: (token: string, newPassword: string) => call(async () => {
        await api.post("/auth/password/reset", { token, newPassword });
    }),
};
