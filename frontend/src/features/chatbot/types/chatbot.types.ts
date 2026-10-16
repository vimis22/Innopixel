import type { Language } from "../../../context/LanguageContext";

// The mascot's expression. Set explicitly by the chat (see hooks/useAvatarState.ts), never by unrelated animations.
export type AvatarState = "idle" | "greeting" | "listening" | "thinking" | "speaking" | "happy" | "error";

export type ChatRole = "assistant" | "visitor";

// Something the visitor can do from an answer: ask a follow-up question or open an existing page
export type ChatAction =
    | { kind: "ask"; label: string; message: string }
    | { kind: "navigate"; label: string; to: string };

export interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;                // plain text, always rendered as text (never as HTML)
    createdAt: number;           // ms since epoch
    actions?: ChatAction[];
    status?: "sent" | "failed";  // visitor messages: "failed" offers a retry
}

// What the assistant is able to answer with right now. Shown in the header instead of a fixed "Online".
export type ChatbotAvailability = "checking" | "demo" | "online" | "unavailable";

export interface ChatRequest {
    message: string;
    language: Language;
    history: Pick<ChatMessage, "role" | "text">[];
}

export interface ChatReply {
    text: string;
    actions: ChatAction[];
}
