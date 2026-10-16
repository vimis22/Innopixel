import api, { apiErrorBody, apiStatus } from "../../services/api";
import type { User } from "../../types/domain";
import { toRepositoryError } from "../workspace/apiErrors";

// The session itself is an HttpOnly cookie set by the backend; JavaScript never sees a token.
export interface Session {
    user: User;
}

export type LoginErrorCode = "INVALID_CREDENTIALS" | "INACTIVE" | "TOO_MANY_ATTEMPTS" | "UNAVAILABLE";

export class LoginError extends Error {
    readonly code: LoginErrorCode;

    constructor(code: LoginErrorCode) {
        super(code);
        this.code = code;
        this.name = "LoginError";
    }
}

export interface AuthService {
    login(email: string, password: string): Promise<Session>;
    restore(): Promise<Session | null>;
    logout(): Promise<void>;
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

// Login against the ASP.NET Core API (backend/src/Innopixel.Main/Controllers/AuthController.cs)
export const apiAuthService: AuthService = {
    async login(email, password) {
        try {
            const { data } = await api.post<User>("/auth/login", { email: email.trim(), password });
            return { user: data };
        } catch (error) {
            const status = apiStatus(error);
            if (status === 401) {
                throw new LoginError(apiErrorBody(error)?.code === "INACTIVE" ? "INACTIVE" : "INVALID_CREDENTIALS");
            }
            throw new LoginError(status === 429 ? "TOO_MANY_ATTEMPTS" : "UNAVAILABLE");
        }
    },

    // Asks the server who is logged in (the cookie is sent automatically)
    async restore() {
        try {
            const { data } = await api.get<User>("/auth/me");
            return { user: data };
        } catch (error) {
            if (apiStatus(error) === 401) return null;
            throw error;
        }
    },

    async logout() {
        await api.post("/auth/logout");
    },

    async changePassword(currentPassword, newPassword) {
        try {
            await api.put("/auth/password", { currentPassword, newPassword });
        } catch (error) {
            throw toRepositoryError(error);
        }
    },
};
