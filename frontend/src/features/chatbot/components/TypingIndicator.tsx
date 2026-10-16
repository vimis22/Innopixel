import ChatbotAvatar from "./ChatbotAvatar";

// "The assistant is writing…" while an answer is on its way
function TypingIndicator({ label }: { label: string }) {
    return (
        <li className="chat-row chat-row--assistant">
            <ChatbotAvatar state="thinking" size="sm" still />
            <div className="chat-bubble chat-bubble--typing">
                <span className="sr-only">{label}</span>
                <span className="chat-typing" aria-hidden="true"><i /><i /><i /></span>
            </div>
        </li>
    );
}

export default TypingIndicator;
