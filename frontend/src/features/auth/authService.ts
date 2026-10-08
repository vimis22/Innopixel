import type { User } from "../../types/domain";
import { createId } from "../../utils/id";
import { DEMO_PASSWORD, delay, readDb } from "../workspace/mockDb";

export interface Session {
    user: User;
    token: string;
}

export type LoginErrorCode = "INVALID_CREDENTIALS" | "INACTIVE";

export class LoginError extends Error {
    readonly code: LoginErrorCode;

    constructor(code: LoginErrorCode) {
        super(code);
        this.code = code;
        this.name = "LoginError";
    }
}

/*
 * Contract for authentication. A production implementation would call the ASP.NET Core API
 * (e.g. POST /auth/login returning a JWT or setting an HttpOnly cookie) and let the server
 * resolve the user and role on every request.
 */
export interface AuthService {
    login(email: string, password: string): Promise<Session>;
    restore(): Promise<Session | null>;
    logout(): Promise<void>;
}

const SESSION_KEY = "innopixel.session.v1";

/*
 * DEVELOPMENT ONLY. Accepts every active demo user with the shared demo password.
 * There is no real security here: the "token" is random and roles live in localStorage.
 */
export const mockAuthService: AuthService = {
    async login(email, password) {
        await delay(600);
        const user = readDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user || password !== DEMO_PASSWORD) throw new LoginError("INVALID_CREDENTIALS");
        if (!user.active) throw new LoginError("INACTIVE");

        const session: Session = { user, token: createId("mock-token") };
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, token: session.token }));
        return session;
    },

    async restore() {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        try {
            const { userId, token } = JSON.parse(raw) as { userId: string; token: string };
            const user = readDb().users.find((u) => u.id === userId && u.active);
            if (!user) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return { user, token };
        } catch {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
    },

    async logout() {
        localStorage.removeItem(SESSION_KEY);
    },
};

// The demo accounts shown on the login page in development mode
export function getDemoAccounts(): Pick<User, "name" | "email" | "role" | "title">[] {
    const preferred = ["mette@innopixel.dk", "ahmad@innopixel.dk", "jonas@innopixel.dk"];
    const users = readDb().users.filter((u) => u.active);
    return preferred
        .map((email) => users.find((u) => u.email === email))
        .filter((u): u is User => Boolean(u));
}

export { DEMO_PASSWORD };
