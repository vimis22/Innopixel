import { useLanguage } from "../../../context/LanguageContext";
import { CloseIcon } from "../../../components/icons/Icons";
import { RefreshIcon } from "../../../components/icons/AppIcons";
import type { AvatarState, ChatbotAvailability } from "../types/chatbot.types";
import ChatbotAvatar from "./ChatbotAvatar";

interface ChatHeaderProps {
    titleId: string;
    avatarState: AvatarState;
    availability: ChatbotAvailability;
    canReset: boolean;
    onReset: () => void;
    onClose: () => void;
}

// Name, real availability (the demo says "Demotilstand", never "Online") and the window's controls
function ChatHeader({ titleId, avatarState, availability, canReset, onReset, onClose }: ChatHeaderProps) {
    const { t } = useLanguage();

    return (
        <header className="chat-header">
            <ChatbotAvatar state={avatarState} size="md" />
            <div className="chat-header-text">
                <h2 id={titleId} className="chat-title">{t("chatbot.name")}</h2>
                <p className={`chat-status chat-status--${availability}`}>
                    <span className="chat-status-dot" aria-hidden="true" />
                    {t(`chatbot.status.${availability}`)}
                </p>
                <p className="chat-description">{t("chatbot.description")}</p>
            </div>
            <div className="chat-header-actions">
                {canReset && (
                    <button type="button" className="chat-icon-btn" onClick={onReset} aria-label={t("chatbot.newConversation")} title={t("chatbot.newConversation")}>
                        <RefreshIcon aria-hidden="true" />
                    </button>
                )}
                <button type="button" className="chat-icon-btn" onClick={onClose} aria-label={t("chatbot.close")} title={t("chatbot.close")}>
                    <CloseIcon aria-hidden="true" />
                </button>
            </div>
        </header>
    );
}

export default ChatHeader;
