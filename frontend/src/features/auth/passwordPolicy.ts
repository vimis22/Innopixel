/*
 * The password rules, shown as a checklist wherever a new password is chosen. They mirror the backend's
 * PasswordPolicy.cs; the server checks again and its answer is the one that counts.
 */

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordRuleKey = "length" | "upper" | "lower" | "digit" | "special";

// Same character classes as .NET's char.IsUpper / IsLower / IsDigit / !IsLetterOrDigit (Unicode-aware)
const RULES: { key: PasswordRuleKey; test: (password: string) => boolean }[] = [
    { key: "length", test: (p) => p.length >= MIN_PASSWORD_LENGTH && p.length <= MAX_PASSWORD_LENGTH },
    { key: "upper", test: (p) => /\p{Lu}/u.test(p) },
    { key: "lower", test: (p) => /\p{Ll}/u.test(p) },
    { key: "digit", test: (p) => /\p{Nd}/u.test(p) },
    { key: "special", test: (p) => /[^\p{L}\p{Nd}]/u.test(p) },
];

export function passwordRules(password: string): { key: PasswordRuleKey; met: boolean }[] {
    return RULES.map((rule) => ({ key: rule.key, met: rule.test(password) }));
}

export function isStrongEnough(password: string): boolean {
    return RULES.every((rule) => rule.test(password));
}

export type NewPasswordError = "required" | "weak" | "mismatch" | "sameAsCurrent";

// The first problem with a new password and its confirmation, or null when it can be sent
export function newPasswordError(password: string, confirmation: string, current?: string): NewPasswordError | null {
    if (!password) return "required";
    if (!isStrongEnough(password)) return "weak";
    if (password !== confirmation) return "mismatch";
    if (current !== undefined && password === current) return "sameAsCurrent";
    return null;
}

// A random 16-character password that meets every rule, from the browser's cryptographic random generator.
// Characters that are easy to confuse (0/O, 1/l/I) are left out, so it can be read aloud or typed.
export function generatePassword(length = 16): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const special = "!#%+-=?@";
    const all = upper + lower + digits + special;

    const pick = (alphabet: string) => alphabet[randomIndex(alphabet.length)];
    const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
    while (chars.length < length) chars.push(pick(all));

    // Fisher–Yates, so the guaranteed characters don't sit at the start
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}

// Uniform random integer in [0, max) without modulo bias
function randomIndex(max: number): number {
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buffer = new Uint32Array(1);
    do crypto.getRandomValues(buffer);
    while (buffer[0] >= limit);
    return buffer[0] % max;
}
