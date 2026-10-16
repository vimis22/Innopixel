import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "../../../context/LanguageContext";
import type { ChatbotService } from "../services/chatbotService";
import type { ChatbotAvailability, ChatMessage } from "../types/chatbot.types";
import { createMessageId, HISTORY_SENT, MAX_MESSAGES, validateMessage } from "../utils/chatbotHelpers";

export interface ChatbotConversation {
    messages: ChatMessage[];
    pending: boolean;               // waiting for an answer
    speakingId: string | null;      // the answer currently being "spoken" (revealed)
    availability: ChatbotAvailability;
    limitReached: boolean;
    send: (text: string) => boolean;
    retry: (messageId: string) => void;
    finishSpeaking: (messageId: string) => void;
    reset: () => void;
}

interface Options {
    service: ChatbotService;
    language: Language;
    active: boolean;                // the availability is checked the first time the chat opens
    onError?: () => void;
}

// The conversation itself, independent of how it is shown. Requests are aborted when the widget unmounts
// or the conversation is reset, so a late answer never updates a conversation that is gone.
export function useChatbot({ service, language, active, onError }: Options): ChatbotConversation {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pending, setPending] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [availability, setAvailability] = useState<ChatbotAvailability>("checking");
    const request = useRef<AbortController | null>(null);
    // Latest values for the callbacks, so they keep a stable identity
    const messagesRef = useRef(messages);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        messagesRef.current = messages;
        onErrorRef.current = onError;
    });

    useEffect(() => () => request.current?.abort(), []);

    useEffect(() => {
        if (!active) return;
        const controller = new AbortController();
        service.getAvailability(controller.signal)
            .then((value) => !controller.signal.aborted && setAvailability(value))
            .catch(() => !controller.signal.aborted && setAvailability("unavailable"));
        return () => controller.abort();
    }, [active, service]);

    const ask = useCallback((visitorMessage: ChatMessage) => {
        const controller = new AbortController();
        request.current = controller;
        setPending(true);

        const history = messagesRef.current
            .filter((m) => m.id !== visitorMessage.id && m.status !== "failed")
            .slice(-HISTORY_SENT)
            .map(({ role, text }) => ({ role, text }));

        service.sendMessage({ message: visitorMessage.text, language, history }, controller.signal)
            .then((reply) => {
                if (controller.signal.aborted) return;
                const answer: ChatMessage = { id: createMessageId(), role: "assistant", text: reply.text, actions: reply.actions, createdAt: Date.now() };
                setMessages((list) => [...list, answer]);
                setSpeakingId(answer.id);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setMessages((list) => list.map((m) => (m.id === visitorMessage.id ? { ...m, status: "failed" } : m)));
                onErrorRef.current?.();
            })
            .finally(() => {
                if (controller.signal.aborted) return;
                request.current = null;
                setPending(false);
            });
    }, [service, language]);

    const limitReached = messages.length >= MAX_MESSAGES;

    const send = useCallback((text: string) => {
        const valid = validateMessage(text);
        if (!valid.ok || request.current || messagesRef.current.length >= MAX_MESSAGES) return false;
        const message: ChatMessage = { id: createMessageId(), role: "visitor", text: valid.message, createdAt: Date.now(), status: "sent" };
        setMessages((list) => [...list, message]);
        setSpeakingId(null);
        ask(message);
        return true;
    }, [ask]);

    const retry = useCallback((messageId: string) => {
        const message = messagesRef.current.find((m) => m.id === messageId && m.status === "failed");
        if (!message || request.current) return;
        const resent = { ...message, status: "sent" as const };
        setMessages((list) => list.map((m) => (m.id === messageId ? resent : m)));
        ask(resent);
    }, [ask]);

    const finishSpeaking = useCallback((messageId: string) => {
        setSpeakingId((current) => (current === messageId ? null : current));
    }, []);

    const reset = useCallback(() => {
        request.current?.abort();
        request.current = null;
        setPending(false);
        setSpeakingId(null);
        setMessages([]);
    }, []);

    return { messages, pending, speakingId, availability, limitReached, send, retry, finishSpeaking, reset };
}
