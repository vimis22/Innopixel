import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { EMAIL_PATTERN } from "../../utils/validation";
import { AlertIcon, ArrowLeftIcon, CheckIcon } from "../../components/icons/AppIcons";
import { errorMessage } from "../../components/ui/Feedback";
import AuthCard from "./components/AuthCard";
import { passwordApi } from "./passwordApi";

/*
 * "Glemt adgangskode". The answer is the same whether or not the address has an account, so the page can't be
 * used to find out who works here. Only rate limits or a server failure give a different message.
 */
function ForgotPasswordPage() {
    const t = useAppText().auth.forgot;
    const login = useAppText().login;
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sentTo, setSentTo] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFailure(null);
        const value = email.trim();
        if (!value) return setError(login.emailRequired);
        if (!EMAIL_PATTERN.test(value)) return setError(login.emailInvalid);
        setError(null);

        setSending(true);
        try {
            await passwordApi.requestReset(value);
            setSentTo(value);
        } catch (err) {
            setFailure(errorMessage(err, login.unavailable));
        } finally {
            setSending(false);
        }
    }

    const back = (
        <Link to={ROUTES.login} className="login-back">
            <ArrowLeftIcon aria-hidden="true" />
            {t.backToLogin}
        </Link>
    );

    if (sentTo) {
        return (
            <AuthCard title={t.sentTitle} topbar={back}>
                <div className="form-success" role="status">
                    <CheckIcon aria-hidden="true" />
                    <span>{t.sentText(sentTo)}</span>
                </div>
                <p className="small text-secondary auth-help">{t.sentHelp}</p>
                <Link to={ROUTES.login} className="app-btn app-btn--primary app-btn--block app-btn--lg">{t.backToLogin}</Link>
            </AuthCard>
        );
    }

    return (
        <AuthCard title={t.title} subtitle={t.subtitle} topbar={back}>
            {failure && (
                <div className="form-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{failure}</span>
                </div>
            )}
            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className={`field ${error ? "field--invalid" : ""}`}>
                    <label htmlFor="forgot-email">{login.email}</label>
                    <input
                        id="forgot-email"
                        type="email"
                        autoComplete="username"
                        placeholder={login.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "forgot-email-error" : undefined}
                        disabled={sending}
                        autoFocus
                    />
                    {error && <p id="forgot-email-error" className="field-error">{error}</p>}
                </div>
                <button type="submit" className="app-btn app-btn--primary app-btn--block app-btn--lg" disabled={sending}>
                    {sending ? <><span className="spinner btn-spinner" aria-hidden="true" />{t.sending}</> : t.submit}
                </button>
            </form>
            <p className="login-note">{t.note}</p>
        </AuthCard>
    );
}

export default ForgotPasswordPage;
