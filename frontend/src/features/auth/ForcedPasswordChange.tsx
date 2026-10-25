import { useState, type FormEvent } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import { AlertIcon, LogoutIcon } from "../../components/icons/AppIcons";
import { errorMessage } from "../../components/ui/Feedback";
import { useAuth } from "./AuthContext";
import AuthCard from "./components/AuthCard";
import NewPasswordFields from "./components/NewPasswordFields";
import PasswordInput from "./components/PasswordInput";
import { newPasswordError, type NewPasswordError } from "./passwordPolicy";

/*
 * "Vælg ny adgangskode": shown instead of the platform while a temporary password is in use (a new account, or
 * one an administrator set). The server refuses every platform request until the password has been changed.
 */
function ForcedPasswordChange() {
    const text = useAppText();
    const t = text.auth.mustChange;
    const { user, changePassword, logout } = useAuth();
    const [current, setCurrent] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [currentMissing, setCurrentMissing] = useState(false);
    const [error, setError] = useState<NewPasswordError | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFailure(null);
        setCurrentMissing(!current);
        const problem = newPasswordError(password, confirmation, current);
        setError(problem);
        if (!current || problem) return;

        setSaving(true);
        try {
            await changePassword(current, password);   // the session continues; the platform opens
        } catch (err) {
            setFailure(errorMessage(err, text.common.genericError));
            setSaving(false);
        }
    }

    return (
        <AuthCard
            title={t.title}
            subtitle={t.subtitle(user?.name.split(" ")[0] ?? "")}
            topbar={
                <button type="button" className="login-back login-back--button" onClick={() => void logout()}>
                    <LogoutIcon aria-hidden="true" />
                    {text.topbar.logout}
                </button>
            }
        >
            {failure && (
                <div className="form-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{failure}</span>
                </div>
            )}
            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className={`field ${currentMissing ? "field--invalid" : ""}`}>
                    <label htmlFor="forced-current">{t.current}</label>
                    <PasswordInput
                        id="forced-current"
                        autoComplete="current-password"
                        value={current}
                        onChange={setCurrent}
                        disabled={saving}
                        autoFocus
                        aria-invalid={currentMissing}
                        aria-describedby={currentMissing ? "forced-current-error" : "forced-current-hint"}
                    />
                    {currentMissing
                        ? <p id="forced-current-error" className="field-error">{text.login.passwordRequired}</p>
                        : <p id="forced-current-hint" className="field-hint">{t.currentHint}</p>}
                </div>
                <NewPasswordFields
                    idPrefix="forced"
                    password={password}
                    confirmation={confirmation}
                    onPasswordChange={setPassword}
                    onConfirmationChange={setConfirmation}
                    error={error}
                    disabled={saving}
                />
                <button type="submit" className="app-btn app-btn--primary app-btn--block app-btn--lg" disabled={saving}>
                    {saving ? <><span className="spinner btn-spinner" aria-hidden="true" />{text.common.saving}</> : t.submit}
                </button>
            </form>
        </AuthCard>
    );
}

export default ForcedPasswordChange;
