import type { Language } from "../../../context/LanguageContext";

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_MESSAGES = 60;            // the conversation stops growing after this many messages
export const HISTORY_SENT = 10;            // how many earlier messages a backend gets as context

let counter = 0;
export function createMessageId(): string {
    counter += 1;
    return `${Date.now().toString(36)}-${counter}`;
}

// Lower case, punctuation turned into spaces, single spaces, padded so " vr " matches whole words
export function normalizeText(value: string): string {
    const words = value.toLocaleLowerCase("da-DK").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return ` ${words} `;
}

// Content from the CMS can contain simple HTML; the chat only ever shows plain text
export function toPlainText(value: string): string {
    return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

// Trimmed message, or the reason it can't be sent
export function validateMessage(value: string): { ok: true; message: string } | { ok: false; reason: "empty" | "tooLong" } {
    const message = value.trim();
    if (!message) return { ok: false, reason: "empty" };
    if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, reason: "tooLong" };
    return { ok: true, message };
}

export function formatMessageTime(timestamp: number, language: Language): string {
    return new Intl.DateTimeFormat(language === "da" ? "da-DK" : "en-GB", { hour: "2-digit", minute: "2-digit" })
        .format(timestamp)
        .replace(".", ":");
}

// "a, b and c" / "a, b og c"
export function joinList(items: string[], language: Language): string {
    if (items.length <= 1) return items.join("");
    return `${items.slice(0, -1).join(", ")} ${language === "da" ? "og" : "and"} ${items[items.length - 1]}`;
}

export function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
