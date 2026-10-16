import { forwardRef, useId, useState, type KeyboardEvent } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { MAX_MESSAGE_LENGTH, validateMessage } from "../utils/chatbotHelpers";

interface ChatInputProps {
    busy: boolean;               // an answer is on its way
    disabled: boolean;           // e.g. the conversation is full
    onSend: (text: string) => boolean;
    onTypingChange: (typing: boolean) => void;
}

// Enter sends, Shift + Enter adds a line. Empty or too long messages can't be sent.
const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput({ busy, disabled, onSend, onTypingChange }, ref) {
    const { t } = useLanguage();
    const [value, setValue] = useState("");
    const hintId = useId();
    const errorId = useId();
    const check = validateMessage(value);
    const tooLong = !check.ok && check.reason === "tooLong";
    const canSend = check.ok && !busy && !disabled;

    function update(next: string) {
        setValue(next);
        onTypingChange(next.trim().length > 0);
    }

    function submit() {
        if (!canSend) return;
        if (onSend(value)) update("");
    }

    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
        }
    }

    const nearLimit = value.length > MAX_MESSAGE_LENGTH * 0.8;
    const feedback = tooLong
        ? t("chatbot.tooLong").replace("{max}", String(MAX_MESSAGE_LENGTH))
        : busy && check.ok ? t("chatbot.busy") : null;

    return (
        <form
            className="chat-input"
            onSubmit={(event) => {
                event.preventDefault();
                submit();
            }}
        >
            <div className="chat-input-row">
                <label className="sr-only" htmlFor={`${hintId}-input`}>{t("chatbot.inputLabel")}</label>
                <textarea
                    ref={ref}
                    id={`${hintId}-input`}
                    className="chat-textarea"
                    rows={1}
                    value={value}
                    placeholder={t("chatbot.placeholder")}
                    disabled={disabled}
                    aria-invalid={tooLong}
                    aria-describedby={`${hintId} ${feedback ? errorId : ""}`.trim()}
                    onChange={(event) => update(event.target.value)}
                    onKeyDown={onKeyDown}
                />
                <button type="submit" className="chat-send" disabled={!canSend} aria-label={t("chatbot.send")} title={t("chatbot.send")}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M3.4 11.2 19.6 4.3c.8-.3 1.5.4 1.2 1.2l-6.9 16.2c-.3.8-1.5.8-1.8 0l-2.2-6-6-2.2c-.8-.3-.8-1.5-.5-2.3Z" fill="currentColor" />
                    </svg>
                </button>
            </div>
            <div className="chat-input-meta">
                <span id={hintId} className="chat-hint">{t("chatbot.inputHint")}</span>
                {nearLimit && <span className={`chat-count ${tooLong ? "is-over" : ""}`}>{value.length}/{MAX_MESSAGE_LENGTH}</span>}
            </div>
            {feedback && <p id={errorId} className={`chat-feedback ${tooLong ? "is-error" : ""}`} role={tooLong ? "alert" : "status"}>{feedback}</p>}
        </form>
    );
});

export default ChatInput;
