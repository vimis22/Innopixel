import api from "../../../services/api";
import type { ChatAction, ChatReply } from "../types/chatbot.types";
import { HISTORY_SENT } from "../utils/chatbotHelpers";
import type { ChatbotService } from "./chatbotService";

/*
 * Prepared for Innopixel's own chatbot backend (not built yet; enable with VITE_CHATBOT_MODE=api).
 * Expected contract:
 *   GET  /api/chatbot/status    -> { available: boolean }
 *   POST /api/chatbot/messages  { message, language, history: [{ role, text }] } -> { text, actions? }
 * The backend owns the AI provider key, rate limits and the approved knowledge base. Answers are shown
 * as plain text, and only navigation to pages of this website is accepted as an action.
 */
export function createApiChatbotService(): ChatbotService {
    return {
        mode: "api",
        async getAvailability(signal) {
            try {
                const { data } = await api.get<{ available?: boolean }>("/chatbot/status", { signal });
                return data.available ? "online" : "unavailable";
            } catch {
                return "unavailable";
            }
        },
        async sendMessage(request, signal) {
            const { data } = await api.post<{ text?: unknown; actions?: unknown }>(
                "/chatbot/messages",
                { message: request.message, language: request.language, history: request.history.slice(-HISTORY_SENT) },
                { signal },
            );
            if (typeof data.text !== "string" || !data.text.trim()) throw new Error("Empty chatbot reply");
            return { text: data.text, actions: safeActions(data.actions) } satisfies ChatReply;
        },
    };
}

// Only well-formed actions that stay on this website (a path starting with a single "/")
export function safeActions(value: unknown): ChatAction[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item): ChatAction[] => {
        if (!item || typeof item !== "object") return [];
        const { kind, label, to, message } = item as Record<string, unknown>;
        if (typeof label !== "string" || !label.trim()) return [];
        if (kind === "navigate" && typeof to === "string" && /^\/(?!\/)/.test(to)) return [{ kind, label, to }];
        if (kind === "ask" && typeof message === "string" && message.trim()) return [{ kind, label, message }];
        return [];
    }).slice(0, 3);
}
