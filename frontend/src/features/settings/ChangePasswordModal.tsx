import { useState, type FormEvent } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";
import { useRunAction } from "../../components/ui/Feedback";
import { useAuth } from "../auth/AuthContext";

const MIN_LENGTH = 10;

// The signed-in user changes their own password (the server checks the current one)
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
    const text = useAppText();
    const t = text.settings.password;
    const { changePassword } = useAuth();
    const run = useRunAction();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (next.length < MIN_LENGTH) return setError(t.tooShort);
        if (next !== confirmation) return setError(t.mismatch);
        setError(null);

        setSaving(true);
        const ok = await run(() => changePassword(current, next), t.saved);
        setSaving(false);
        if (ok) onClose();
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
                    <div className="field field--full">
                        <label htmlFor="password-current">{t.current}</label>
                        <input id="password-current" type="password" autoComplete="current-password" value={current}
                            onChange={(e) => setCurrent(e.target.value)} autoFocus required />
                    </div>
                    <div className={`field field--full ${error ? "field--invalid" : ""}`}>
                        <label htmlFor="password-new">{t.new}</label>
                        <input id="password-new" type="password" autoComplete="new-password" value={next} minLength={MIN_LENGTH}
                            onChange={(e) => setNext(e.target.value)} aria-describedby="password-hint" required />
                        <p id="password-hint" className="field-hint">{text.settings.changePasswordSub}</p>
                    </div>
                    <div className={`field field--full ${error ? "field--invalid" : ""}`}>
                        <label htmlFor="password-confirm">{t.confirm}</label>
                        <input id="password-confirm" type="password" autoComplete="new-password" value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)} aria-invalid={Boolean(error)}
                            aria-describedby={error ? "password-error" : undefined} required />
                        {error && <p id="password-error" className="field-error">{error}</p>}
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
}

export default ChangePasswordModal;
