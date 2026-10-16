import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import { chatbotService, type ChatbotService } from "../services/chatbotService";
import type { ChatAction } from "../types/chatbot.types";
import { useChatbot } from "../hooks/useChatbot";
import { deriveAvatarState, useAvatarLook, useAvatarReaction } from "../hooks/useAvatarState";
import ChatbotAvatar from "./ChatbotAvatar";
import "../styles/chatbot.css";

// The window (and its messages, input and knowledge) is only downloaded when a visitor opens the chat
const ChatWindow = lazy(() => import("./ChatWindow"));

const SEEN_KEY = "innopixel.chatbot.seen";     // only a flag: has this browser opened the chat before
const ATTENTION_DELAY_MS = 4000;

// The floating mascot in the bottom-right corner of every public page, and the chat it opens
function ChatbotWidget({ service = chatbotService }: { service?: ChatbotService }) {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [everOpened, setEverOpened] = useState(false);
    const [openedAt, setOpenedAt] = useState(0);
    const [typing, setTyping] = useState(false);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const { reaction, react } = useAvatarReaction();
    const conversation = useChatbot({ service, language, active: everOpened, onError: () => react("error") });
    const avatarState = deriveAvatarState(
        { pending: conversation.pending, speaking: conversation.speakingId !== null, typing: typing && open },
        reaction,
    );

    useAvatarLook(rootRef, !open);

    // A small wave for first-time visitors, once, a few seconds after the page loads
    useEffect(() => {
        if (localStorage.getItem(SEEN_KEY)) return;
        const timer = setTimeout(() => react("greeting"), ATTENTION_DELAY_MS);
        return () => clearTimeout(timer);
    }, [react]);

    const openChat = useCallback(() => {
        setOpen(true);
        setEverOpened(true);
        setOpenedAt((at) => at || Date.now());
        react("greeting");
        localStorage.setItem(SEEN_KEY, "1");
    }, [react]);

    const closeChat = useCallback(() => {
        setOpen(false);
        setTyping(false);
        launcherRef.current?.focus();
    }, []);

    const onAction = useCallback((action: ChatAction) => {
        if (action.kind !== "navigate") return;
        react("happy");
        navigate(action.to);
        // On a phone the chat covers the page, so step aside to show it
        if (window.matchMedia("(max-width: 640px)").matches) setOpen(false);
    }, [navigate, react]);

    return (
        <div ref={rootRef} className={`chatbot ${open ? "is-open" : ""}`}>
            {everOpened && (
                <Suspense fallback={null}>
                    <div className="chat-window-wrap" hidden={!open}>
                        <ChatWindow
                            conversation={conversation}
                            avatarState={avatarState}
                            openedAt={openedAt}
                            onClose={closeChat}
                            onAction={onAction}
                            onTypingChange={setTyping}
                        />
                    </div>
                </Suspense>
            )}

            <button
                ref={launcherRef}
                type="button"
                className="chat-launcher"
                aria-label={open ? t("chatbot.close") : t("chatbot.open")}
                aria-expanded={open}
                onClick={open ? closeChat : openChat}
            >
                <ChatbotAvatar state={avatarState} size="lg" />
            </button>
        </div>
    );
}

export default ChatbotWidget;
