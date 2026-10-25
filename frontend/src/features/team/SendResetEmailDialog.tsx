import { useState } from "react";
import type { User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";
import { errorMessage } from "../../components/ui/Feedback";
import { AlertIcon, InfoIcon } from "../../components/icons/AppIcons";
import { CheckCircleIcon } from "../../components/icons/Icons";
import { accountApi } from "./accountApi";

interface SendResetEmailDialogProps {
    user: User;
    onClose: () => void;
}

// "Send nulstillingsmail": confirm, send, then say so. The e-mail holds a single-use link, never a password.
function SendResetEmailDialog({ user, onClose }: SendResetEmailDialogProps) {
    const text = useAppText();
    const t = text.team.access;
    const [state, setState] = useState<"confirm" | "sending" | "sent">("confirm");
    const [error, setError] = useState<string | null>(null);

    async function send() {
        setState("sending");
        setError(null);
        try {
            await accountApi.sendResetEmail(user.id);
            setState("sent");
        } catch (err) {
            setError(errorMessage(err, text.common.genericError));
            setState("confirm");
        }
    }

    if (state === "sent") {
        return (
            <Modal open size="sm" title={t.resetSentTitle} onClose={onClose}
                footer={<button type="button" className="app-btn app-btn--primary" onClick={onClose} autoFocus>{text.common.close}</button>}>
                <div className="dialog-result" role="status">
                    <CheckCircleIcon className="dialog-result-icon" aria-hidden="true" />
                    <p>{t.resetSentText(user.email)}</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            open
            size="sm"
            title={t.resetTitle}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={state === "sending"}>{text.common.cancel}</button>
                    <button type="button" className="app-btn app-btn--primary" onClick={() => void send()} disabled={state === "sending"} autoFocus>
                        {state === "sending" ? t.resetSending : t.resetSend}
                    </button>
                </>
            }
        >
            <p className="dialog-lead">{t.resetLead(user.email)}</p>
            <p className="notice"><InfoIcon aria-hidden="true" />{t.resetValidity}</p>
            {error && (
                <div className="form-alert dialog-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}
        </Modal>
    );
}

export default SendResetEmailDialog;
