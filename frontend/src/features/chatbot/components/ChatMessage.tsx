import { memo, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import type { ChatAction, ChatMessage as ChatMessageData } from "../types/chatbot.types";
import { formatMessageTime } from "../utils/chatbotHelpers";
import { useRevealText } from "../hooks/useRevealText";
import ChatbotAvatar from "./ChatbotAvatar";
import QuickActions from "./QuickActions";

interface ChatMessageProps {
    message: ChatMessageData;
    speaking: boolean;
    showActions: boolean;        // only the latest answer offers its follow-ups
    busy: boolean;
    onSpoken: (id: string) => void;
    onAction: (action: ChatAction) => void;
    onRetry: (id: string) => void;
}

// One message. Text is rendered as text (React escapes it), so visitor input can never become HTML.
function ChatMessage({ message, speaking, showActions, busy, onSpoken, onAction, onRetry }: ChatMessageProps) {
    const { t, language } = useLanguage();
    const done = useCallback(() => onSpoken(message.id), [onSpoken, message.id]);
    const shown = useRevealText(message.text, speaking, done);
    const time = formatMessageTime(message.createdAt, language);
    const isAssistant = message.role === "assistant";

    return (
        <li className={`chat-row chat-row--${message.role}`}>
            {isAssistant && <ChatbotAvatar state={speaking ? "speaking" : "idle"} size="sm" still />}
            <div className="chat-message">
                <div className={`chat-bubble chat-bubble--${message.role} ${message.status === "failed" ? "is-failed" : ""}`}>
                    <span className="sr-only">{isAssistant ? t("chatbot.assistant") : t("chatbot.you")}: </span>
                    {/* Screen readers get the whole answer at once; the word-by-word reveal is visual only */}
                    <p className="chat-text">
                        {speaking ? <><span className="sr-only">{message.text}</span><span aria-hidden="true">{shown}</span></> : message.text}
                    </p>
                    <time className="chat-time" dateTime={new Date(message.createdAt).toISOString()} title={t("chatbot.sentAt").replace("{time}", time)}>
                        {time}
                    </time>
                </div>
                {message.status === "failed" && (
                    <p className="chat-failed" role="alert">
                        {t("chatbot.errorReply")}
                        <button type="button" className="chat-retry" onClick={() => onRetry(message.id)} disabled={busy}>{t("chatbot.retry")}</button>
                    </p>
                )}
                {isAssistant && showActions && !speaking && message.actions && (
                    <QuickActions label={t("chatbot.suggestionsLabel")} actions={message.actions} disabled={busy} onAction={onAction} />
                )}
            </div>
        </li>
    );
}

export default memo(ChatMessage);
