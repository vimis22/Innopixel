import { useEffect, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { ROUTES } from "../../../config/routes";
import type { ChatbotConversation } from "../hooks/useChatbot";
import type { AvatarState, ChatAction } from "../types/chatbot.types";
import { formatMessageTime } from "../utils/chatbotHelpers";
import ChatbotAvatar from "./ChatbotAvatar";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import QuickActions from "./QuickActions";
import TypingIndicator from "./TypingIndicator";

interface ChatWindowProps {
    conversation: ChatbotConversation;
    avatarState: AvatarState;
    openedAt: number;
    onClose: () => void;
    onAction: (action: ChatAction) => void;
    onTypingChange: (typing: boolean) => void;
}

// The open chat: a non-modal dialog above the launcher (a bottom sheet on phones). Loaded on first open.
function ChatWindow({ conversation, avatarState, openedAt, onClose, onAction, onTypingChange }: ChatWindowProps) {
    const { t, language } = useLanguage();
    const { messages, pending, speakingId, availability, limitReached } = conversation;
    const titleId = useId();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLOListElement>(null);
    const stickToBottom = useRef(true);

    useEffect(() => {
        inputRef.current?.focus({ preventScroll: true });
    }, []);

    // Follow new messages (and an answer as it is revealed) unless the visitor has scrolled up to read
    useEffect(() => {
        const log = logRef.current;
        const list = listRef.current;
        if (!log || !list) return;
        const follow = () => {
            if (stickToBottom.current) log.scrollTop = log.scrollHeight;
        };
        const observer = new ResizeObserver(follow);
        observer.observe(list);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const last = messages.at(-1);
        if (last?.role === "visitor") stickToBottom.current = true;
    }, [messages]);

    // The welcome follows the website's language, also after switching
    const welcomeActions = useMemo<ChatAction[]>(() => [
        { kind: "ask", label: t("chatbot.quick.services"), message: t("chatbot.quick.servicesQuestion") },
        { kind: "navigate", label: t("chatbot.quick.projects"), to: ROUTES.projects },
        { kind: "navigate", label: t("chatbot.quick.contact"), to: ROUTES.contact },
        { kind: "ask", label: t("chatbot.quick.vr"), message: t("chatbot.quick.vrQuestion") },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [language]);

    const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
    const unavailable = availability === "unavailable";
    const sendAction = (action: ChatAction) => {
        if (action.kind === "ask") conversation.send(action.message);
        else onAction(action);
    };

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
        }
    }

    return (
        <div className="chat-window" role="dialog" aria-modal="false" aria-labelledby={titleId} onKeyDown={onKeyDown}>
            <ChatHeader
                titleId={titleId}
                avatarState={avatarState}
                availability={availability}
                canReset={messages.length > 0}
                onReset={() => {
                    conversation.reset();
                    inputRef.current?.focus();
                }}
                onClose={onClose}
            />

            {unavailable && <p className="chat-notice chat-notice--warning" role="status">{t("chatbot.unavailableNotice")}</p>}

            <div
                ref={logRef}
                className="chat-log"
                onScroll={(event) => {
                    const el = event.currentTarget;
                    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
                }}
            >
                <ol ref={listRef} className="chat-list" role="log" aria-live="polite" aria-relevant="additions" aria-label={t("chatbot.conversationLabel")}>
                    {/* Part of the conversation, so it scrolls away instead of taking room for good */}
                    {availability === "demo" && <li className="chat-notice">{t("chatbot.demoNotice")}</li>}
                    <li className="chat-row chat-row--assistant">
                        <ChatbotAvatar state="greeting" size="sm" still />
                        <div className="chat-message">
                            <div className="chat-bubble chat-bubble--assistant">
                                <p className="chat-text">
                                    <strong>{t("chatbot.welcomeTitle")}<br />{t("chatbot.welcomeIntro")}</strong>
                                    <br />
                                    {t("chatbot.welcomeBody")}
                                </p>
                                <time className="chat-time" dateTime={new Date(openedAt).toISOString()}>{formatMessageTime(openedAt, language)}</time>
                            </div>
                            {messages.length === 0 && (
                                <QuickActions label={t("chatbot.suggestionsLabel")} actions={welcomeActions} disabled={pending || unavailable} onAction={sendAction} />
                            )}
                        </div>
                    </li>

                    {messages.map((message) => (
                        <ChatMessage
                            key={message.id}
                            message={message}
                            speaking={message.id === speakingId}
                            showActions={message.id === lastAssistantId && !pending}
                            busy={pending}
                            onSpoken={conversation.finishSpeaking}
                            onAction={sendAction}
                            onRetry={conversation.retry}
                        />
                    ))}

                    {pending && <TypingIndicator label={t("chatbot.typing")} />}
                </ol>
            </div>

            {limitReached && (
                <p className="chat-notice chat-notice--warning">
                    {t("chatbot.limitReached")}{" "}
                    <button type="button" className="chat-retry" onClick={conversation.reset}>{t("chatbot.newConversation")}</button>
                </p>
            )}

            <ChatInput ref={inputRef} busy={pending} disabled={limitReached || unavailable} onSend={conversation.send} onTypingChange={onTypingChange} />
        </div>
    );
}

export default ChatWindow;
