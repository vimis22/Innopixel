import api from "../../services/api";
import type { UserAccount } from "../../types/domain";
import { call } from "../workspace/apiErrors";

/*
 * The Access tab (administrators): login details, temporary passwords and reset e-mails
 * (backend/src/Innopixel.Main/Controllers/WorkspaceController.cs). The server checks the role on every call.
 * Passwords are sent once and never come back.
 */

const id = encodeURIComponent;

export const accountApi = {
    get: (userId: string) => call(async () => (await api.get<UserAccount>(`/workspace/users/${id(userId)}/account`)).data),

    // adminPassword: the administrator's own password, confirming the sensitive action
    setTemporaryPassword: (userId: string, password: string, adminPassword: string) => call(async () => {
        await api.put(`/workspace/users/${id(userId)}/temporary-password`, { password, adminPassword });
    }),

    sendResetEmail: (userId: string) => call(async () => {
        await api.post(`/workspace/users/${id(userId)}/password-reset-email`);
    }),

    emailConfigured: () => call(async () => (await api.get<{ configured: boolean }>("/workspace/email-status")).data.configured),
};
