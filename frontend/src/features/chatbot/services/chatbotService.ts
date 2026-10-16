import type { ChatbotAvailability, ChatReply, ChatRequest } from "../types/chatbot.types";
import { createApiChatbotService } from "./apiChatbotService";
import { createDemoChatbotService } from "./demoChatbotService";

/*
 * Where the chat's answers come from. The UI only knows this interface, so the demo can be replaced by a
 * real assistant without touching any component.
 *
 * A real AI assistant must run behind Innopixel's own backend: the browser sends the visitor's message to
 * /api/chatbot, and only the server talks to an AI provider with its secret key. Never put an API key in
 * React code, in browser storage or in a VITE_* variable (they are all readable by every visitor).
 */
export interface ChatbotService {
    // "demo" answers from the website's own content; "api" asks Innopixel's backend
    readonly mode: "demo" | "api";
    getAvailability(signal: AbortSignal): Promise<ChatbotAvailability>;
    sendMessage(request: ChatRequest, signal: AbortSignal): Promise<ChatReply>;
}

// VITE_CHATBOT_MODE=api switches to the backend once /api/chatbot exists. Anything else, or nothing, is the demo.
export function createChatbotService(): ChatbotService {
    return import.meta.env.VITE_CHATBOT_MODE === "api" ? createApiChatbotService() : createDemoChatbotService();
}

export const chatbotService: ChatbotService = createChatbotService();
