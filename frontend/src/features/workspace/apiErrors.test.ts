import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { da } from "../../i18n/app/da";
import { appTextByKey, toRepositoryError } from "./apiErrors";
import { RepositoryError } from "./repository";

function httpError(status: number, data?: unknown): AxiosError {
    const headers = new AxiosHeaders();
    return new AxiosError("Request failed", "ERR_BAD_RESPONSE", { headers }, null, {
        status, statusText: "", headers, config: { headers }, data,
    });
}

describe("api errors", () => {
    it("looks up the backend's message keys in da.ts", () => {
        expect(appTextByKey("projects.validation.endBeforeStart")).toBe(da.projects.validation.endBeforeStart);
        expect(appTextByKey("team.cannotDeactivateSelf")).toBe(da.team.cannotDeactivateSelf);
        expect(appTextByKey("does.not.exist")).toBeNull();
        expect(appTextByKey("team")).toBeNull();
    });

    it("turns the backend's error body into a RepositoryError with the Danish text", () => {
        const error = toRepositoryError(httpError(400, { code: "VALIDATION", messageKey: "tasks.validation.assigneeNotMember" }));
        expect(error).toBeInstanceOf(RepositoryError);
        expect(error.code).toBe("VALIDATION");
        expect(error.message).toBe(da.tasks.validation.assigneeNotMember);
    });

    it("falls back to a sensible message for unknown keys and plain HTTP errors", () => {
        expect(toRepositoryError(httpError(403, { code: "FORBIDDEN", messageKey: "unknown.key" })).message).toBe(da.common.noAccess);
        expect(toRepositoryError(httpError(404)).code).toBe("NOT_FOUND");
        expect(toRepositoryError(httpError(429)).message).toBe(da.errors.tooManyRequests);
        expect(toRepositoryError(httpError(500)).message).toBe(da.common.genericError);
        expect(toRepositoryError(new AxiosError("Network Error", "ERR_NETWORK")).message).toBe(da.errors.connectionFailed);
    });
});
