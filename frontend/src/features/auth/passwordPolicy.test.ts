import { describe, expect, it } from "vitest";
import { generatePassword, isStrongEnough, newPasswordError, passwordRules } from "./passwordPolicy";

describe("password policy (mirrors PasswordPolicy.cs)", () => {
    it.each([
        ["Stærk-Kode-2026", true],
        ["Aa1!aaaaaa", true],
        ["Aa1!aaaaa", false],          // 9 characters
        ["alle-smaa-2026!", false],    // no upper case
        ["ALLE-STORE-2026!", false],   // no lower case
        ["Ingen-Tal-Her!", false],     // no digit
        ["IngenSpecial2026", false],   // no special character
        ["", false],
    ])("%s → %s", (password, expected) => {
        expect(isStrongEnough(password)).toBe(expected);
    });

    it("rejects passwords over 128 characters", () => {
        expect(isStrongEnough("Aa1!" + "x".repeat(125))).toBe(false);
    });

    it("reports each rule for the checklist", () => {
        expect(passwordRules("abc")).toEqual([
            { key: "length", met: false },
            { key: "upper", met: false },
            { key: "lower", met: true },
            { key: "digit", met: false },
            { key: "special", met: false },
        ]);
    });
});

describe("newPasswordError", () => {
    it("checks presence, strength, confirmation and reuse in that order", () => {
        expect(newPasswordError("", "")).toBe("required");
        expect(newPasswordError("svag", "svag")).toBe("weak");
        expect(newPasswordError("Stærk-Kode-2026", "Stærk-Kode-2025")).toBe("mismatch");
        expect(newPasswordError("Stærk-Kode-2026", "Stærk-Kode-2026", "Stærk-Kode-2026")).toBe("sameAsCurrent");
        expect(newPasswordError("Stærk-Kode-2026", "Stærk-Kode-2026", "Gammel-Kode-1!")).toBeNull();
    });
});

describe("generatePassword", () => {
    it("always meets the policy, avoids confusable characters and doesn't repeat", () => {
        const passwords = Array.from({ length: 300 }, () => generatePassword());
        for (const password of passwords) {
            expect(password).toHaveLength(16);
            expect(isStrongEnough(password)).toBe(true);
            expect(password).not.toMatch(/[0O1lI]/);
        }
        expect(new Set(passwords).size).toBe(passwords.length);
    });
});
