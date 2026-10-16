import { da } from "../../i18n/app/da";
import { apiErrorBody, apiStatus } from "../../services/api";
import { RepositoryError, type RepositoryErrorCode } from "./repository";

// Looks up "projects.validation.nameRequired" in da.ts. The backend only sends the key, so the texts live in one place.
export function appTextByKey(key: string | undefined): string | null {
    if (!key) return null;
    const value = key.split(".").reduce<unknown>(
        (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
        da,
    );
    return typeof value === "string" ? value : null;
}

const CODES: RepositoryErrorCode[] = ["FORBIDDEN", "NOT_FOUND", "VALIDATION"];

// Turns any failed API call into a RepositoryError with a message that is safe to show
export function toRepositoryError(error: unknown): RepositoryError {
    if (error instanceof RepositoryError) return error;

    const body = apiErrorBody(error);
    const code = CODES.find((c) => c === body?.code);
    if (code) {
        return new RepositoryError(code, appTextByKey(body?.messageKey) ?? fallbackFor(code));
    }

    const status = apiStatus(error);
    if (status === 401 || status === 403) return new RepositoryError("FORBIDDEN", da.common.noAccess);
    if (status === 404) return new RepositoryError("NOT_FOUND", da.errors.notFoundText);
    if (status === 429) return new RepositoryError("UNAVAILABLE", da.errors.tooManyRequests);
    if (status === null) return new RepositoryError("UNAVAILABLE", da.errors.connectionFailed);
    return new RepositoryError("UNAVAILABLE", da.common.genericError);
}

function fallbackFor(code: RepositoryErrorCode): string {
    switch (code) {
        case "FORBIDDEN": return da.common.noAccess;
        case "NOT_FOUND": return da.errors.notFoundText;
        default: return da.common.genericError;
    }
}

// Runs an API call and converts its failures
export async function call<T>(request: () => Promise<T>): Promise<T> {
    try {
        return await request();
    } catch (error) {
        throw toRepositoryError(error);
    }
}
