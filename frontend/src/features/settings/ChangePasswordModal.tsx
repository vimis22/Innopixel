import { useState, type FormEvent } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";
import { errorMessage, useFeedback } from "../../components/ui/Feedback";
import { useAuth } from "../auth/AuthContext";
import NewPasswordFields from "../auth/components/NewPasswordFields";
import PasswordInput from "../auth/components/PasswordInput";
import { newPasswordError, type NewPasswordError } from "../auth/passwordPolicy";

// The signed-in user changes their own password. The server checks the current one and ends every other session.
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const text = useAppText();
    const t = text.settings.password;
    const { changePassword } = useAuth();
    const { toast } = useFeedback();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [currentError, setCurrentError] = useState<string | null>(null);
    const [error, setError] = useState<NewPasswordError | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const problem = newPasswordError(next, confirmation, current);
        setCurrentError(current ? null : text.login.passwordRequired);
        setError(problem);
        if (!current || problem) return;

        setSaving(true);
        try {
            await changePassword(current, next);
            toast("success", t.saved);
            onClose();
        } catch (err) {
            // A wrong current password belongs to that field; anything else is a general error
            const message = errorMessage(err, text.common.genericError);
            if (message === t.currentWrong) setCurrentError(message);
            else toast("error", message);
            setSaving(false);
        }
    }

    return (
        <Modal
            open
            size="sm"
            title={text.settings.changePassword}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" form="password-form" className="app-btn app-btn--primary" disabled={saving}>
                        {saving ? text.common.saving : t.save}
                    </button>
                </>
            }
        >
            <form id="password-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <div className={`field field--full ${currentError ? "field--invalid" : ""}`}>
                        <label htmlFor="password-current">{t.current}</label>
                        <PasswordInput
                            id="password-current"
                            autoComplete="current-password"
                            value={current}
                            onChange={setCurrent}
                            autoFocus
                            aria-invalid={Boolean(currentError)}
                            aria-describedby={currentError ? "password-current-error" : undefined}
                        />
                        {currentError && <p id="password-current-error" className="field-error" role="alert">{currentError}</p>}
                    </div>
                    <NewPasswordFields
                        idPrefix="password"
                        password={next}
                        confirmation={confirmation}
                        onPasswordChange={setNext}
                        onConfirmationChange={setConfirmation}
                        error={error}
                    />
                    <p className="field-hint field--full">{t.sessionsNote}</p>
                </fieldset>
            </form>
        </Modal>
    );
}

export default ChangePasswordModal;
