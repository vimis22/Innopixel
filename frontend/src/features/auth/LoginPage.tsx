import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES, ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { EMAIL_PATTERN } from "../../utils/validation";
import LoadingState from "../../components/ui/LoadingState";
import { AlertIcon, CheckIcon, LockIcon } from "../../components/icons/AppIcons";
import { useAuth } from "./AuthContext";
import { LoginError, type LoginErrorCode } from "./authService";
import AuthCard from "./components/AuthCard";
import PasswordInput from "./components/PasswordInput";

// Set by the reset page after a new password was saved (navigation state, not the URL)
export interface LoginNotice {
    notice?: "passwordReset";
}

interface FieldErrors {
    email?: string;
    password?: string;
}

function LoginPage() {
    const text = useAppText();
    const t = text.login;
    const { user, initializing, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Return to the page that required login, but only inside the app
    const state = location.state as ({ from?: string } & LoginNotice) | null;
    const from = state?.from;
    const target = from?.startsWith("/app") ? from : APP_ROUTES.dashboard;

    if (initializing) return <LoadingState fullscreen />;
    if (user) return <Navigate to={target} replace />;

    function validate(): FieldErrors {
        const next: FieldErrors = {};
        if (!email.trim()) next.email = t.emailRequired;
        else if (!EMAIL_PATTERN.test(email.trim())) next.email = t.emailInvalid;
        if (!password) next.password = t.passwordRequired;
        return next;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const next = validate();
        setErrors(next);
        if (next.email || next.password) {
            document.getElementById(next.email ? "login-email" : "login-password")?.focus();
            return;
        }

        setSubmitting(true);
        try {
            await login(email, password);
            navigate(target, { replace: true });
        } catch (error) {
            const messages: Record<LoginErrorCode, string> = {
                INVALID_CREDENTIALS: t.invalidCredentials,
                INACTIVE: t.inactive,
                TOO_MANY_ATTEMPTS: t.tooManyAttempts,
                UNAVAILABLE: t.unavailable,
            };
            setFormError(error instanceof LoginError ? messages[error.code] : t.unavailable);
            setSubmitting(false);
        }
    }

    return (
        <AuthCard title={t.title} subtitle={t.subtitle}>
            {state?.notice === "passwordReset" && !formError && (
                <div className="form-success" role="status">
                    <CheckIcon aria-hidden="true" />
                    <span>{t.passwordResetDone}</span>
                </div>
            )}
            {formError && (
                <div className="form-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{formError}</span>
                </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className={`field ${errors.email ? "field--invalid" : ""}`}>
                    <label htmlFor="login-email">{t.email}</label>
                    <input
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "login-email-error" : undefined}
                        disabled={submitting}
                    />
                    {errors.email && <p id="login-email-error" className="field-error">{errors.email}</p>}
                </div>

                <div className={`field ${errors.password ? "field--invalid" : ""}`}>
                    <div className="field-label-row">
                        <label htmlFor="login-password">{t.password}</label>
                        <Link to={ROUTES.forgotPassword} className="login-forgot">{t.forgotPassword}</Link>
                    </div>
                    <PasswordInput
                        id="login-password"
                        autoComplete="current-password"
                        value={password}
                        onChange={setPassword}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "login-password-error" : undefined}
                        disabled={submitting}
                    />
                    {errors.password && <p id="login-password-error" className="field-error">{errors.password}</p>}
                </div>

                <button type="submit" className="app-btn app-btn--primary app-btn--block app-btn--lg" disabled={submitting}>
                    {submitting ? <><span className="spinner btn-spinner" aria-hidden="true" />{t.submitting}</> : t.submit}
                </button>
            </form>

            <p className="login-note">
                <LockIcon aria-hidden="true" />
                {t.noRegistration}
            </p>
        </AuthCard>
    );
}

export default LoginPage;
