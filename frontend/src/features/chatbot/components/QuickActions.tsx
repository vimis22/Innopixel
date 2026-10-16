import { ArrowRightIcon } from "../../../components/icons/AppIcons";
import type { ChatAction } from "../types/chatbot.types";

interface QuickActionsProps {
    label: string;
    actions: ChatAction[];
    disabled?: boolean;
    onAction: (action: ChatAction) => void;
}

// Suggested follow-ups: "ask" sends the question, "navigate" opens an existing page of the website
function QuickActions({ label, actions, disabled = false, onAction }: QuickActionsProps) {
    if (actions.length === 0) return null;
    return (
        <ul className="chat-actions" aria-label={label}>
            {actions.map((action) => (
                <li key={`${action.kind}-${action.label}`}>
                    <button type="button" className="chat-action" disabled={disabled && action.kind === "ask"} onClick={() => onAction(action)}>
                        {action.label}
                        {action.kind === "navigate" && <ArrowRightIcon aria-hidden="true" />}
                    </button>
                </li>
            ))}
        </ul>
    );
}

export default QuickActions;
