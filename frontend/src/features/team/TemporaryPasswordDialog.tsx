import { useState, type FormEvent } from "react";
import type { User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";
import { errorMessage, useFeedback } from "../../components/ui/Feedback";
import { InfoIcon, RefreshIcon } from "../../components/icons/AppIcons";
import NewPasswordFields from "../auth/components/NewPasswordFields";
import PasswordInput from "../auth/components/PasswordInput";
import { generatePassword, newPasswordError, type NewPasswordError } from "../auth/passwordPolicy";
import { accountApi } from "./accountApi";

interface TemporaryPasswordDialogProps {
    user: User;
    onClose: () => void;
    onSaved: () => void;
}

/*
 * "Angiv midlertidig adgangskode". The administrator chooses (or generates) a password and confirms with their
 * own. The employee always has to choose a new one at next login; there is no way to set a permanent password
 * for someone else. The password is sent once and never shown again.
 */
function TemporaryPasswordDialog({ user, onClose, onSaved }: TemporaryPasswordDialogProps) {
    const text = useAppText();
    const t = text.team.access;
    const { toast } = useFeedback();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [error, setError] = useState<NewPasswordError | null>(null);
    const [adminError, setAdminError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    function generate() {
        const value = generatePassword();
        setPassword(value);
        setConfirmation(value);
        setError(null);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const problem = newPasswordError(password, confirmation);
        setError(problem);
        setAdminError(adminPassword ? null : t.adminPasswordRequired);
        if (problem || !adminPassword) return;

        setSaving(true);
        try {
            await accountApi.setTemporaryPassword(user.id, password, adminPassword);
            toast("success", t.temporarySaved(user.name));
            onSaved();
            onClose();
        } catch (err) {
            const message = errorMessage(err, text.common.genericError);
            if (message === t.adminPasswordWrong) setAdminError(message);
            else toast("error", message);
            setSaving(false);
        }
    }

    return (
        <Modal
            open
            title={t.temporaryTitle}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="submit" form="temporary-password-form" className="app-btn app-btn--primary" disabled={saving}>
                        {saving ? text.common.saving : t.temporarySave}
                    </button>
                </>
            }
        >
            <p className="dialog-lead">{t.temporaryLead(user.name)}</p>
            <form id="temporary-password-form" className="form-grid" onSubmit={handleSubmit} noValidate>
                <fieldset className="form-fieldset" disabled={saving}>
                    <NewPasswordFields
                        idPrefix="temporary"
                        password={password}
                        confirmation={confirmation}
                        onPasswordChange={setPassword}
                        onConfirmationChange={setConfirmation}
                        error={error}
                        labels={{ password: t.temporaryNew, confirmation: t.temporaryConfirm }}
                        autoFocus
                        passwordAction={
                            <button type="button" className="app-btn app-btn--ghost" onClick={generate}>
                                <RefreshIcon aria-hidden="true" /> {t.generate}
                            </button>
                        }
                    />
                    <p className="notice field--full"><InfoIcon aria-hidden="true" />{t.temporaryRules}</p>
                    <div className={`field field--full ${adminError ? "field--invalid" : ""}`}>
                        <label htmlFor="temporary-admin">{t.adminPassword}</label>
                        <PasswordInput
                            id="temporary-admin"
                            autoComplete="current-password"
                            value={adminPassword}
                            onChange={setAdminPassword}
                            aria-invalid={Boolean(adminError)}
                            aria-describedby={adminError ? "temporary-admin-error" : "temporary-admin-hint"}
                        />
                        {adminError
                            ? <p id="temporary-admin-error" className="field-error" role="alert">{adminError}</p>
                            : <p id="temporary-admin-hint" className="field-hint">{t.adminPasswordHint}</p>}
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
}

export default TemporaryPasswordDialog;
