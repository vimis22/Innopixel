import { apiAuthService, type AuthService } from "../features/auth/authService";

// Kept separate from services.ts so the public site only loads the auth part
export const authService: AuthService = apiAuthService;
