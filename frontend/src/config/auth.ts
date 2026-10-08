import { mockAuthService, type AuthService } from "../features/auth/authService";

/*
 * Data sources for the internal platform. Only mock implementations exist so far
 * (development only, no real security). When the ASP.NET Core API is ready, add an
 * ApiAuthService here (and ApiWorkspaceRepository in services.ts) and select them
 * when VITE_USE_MOCK_API is "false".
 */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

if (!USE_MOCK_API) {
    console.warn("VITE_USE_MOCK_API=false, but no API implementation exists yet. Falling back to mock services.");
}

// Kept separate from services.ts so the public site only loads the auth part
export const authService: AuthService = mockAuthService;
