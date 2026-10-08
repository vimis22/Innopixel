import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES, ROUTES } from "../../config/routes";
import { USE_MOCK_API } from "../../config/auth";
import { useAppText } from "../../i18n/app/useAppText";
import { EMAIL_PATTERN } from "../../utils/validation";
import ThemeToggle from "../../components/common/ThemeToggle";
import LoadingState from "../../components/ui/LoadingState";
import { AlertIcon, ArrowLeftIcon, EyeIcon, EyeOffIcon, LockIcon } from "../../components/icons/AppIcons";
import { useAuth } from "./AuthContext";
import { DEMO_PASSWORD, getDemoAccounts, LoginError } from "./authService";
import "../../styles/app/index.css";

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
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Return to the page that required login, but only inside the app
    const from = (location.state as { from?: string } | null)?.from;
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
            setFormError(error instanceof LoginError && error.code === "INACTIVE" ? t.inactive : t.invalidCredentials);
            setSubmitting(false);
        }
    }

    function fillDemo(demoEmail: string) {
        setEmail(demoEmail);
        setPassword(DEMO_PASSWORD);
        setErrors({});
        setFormError(null);
    }

    return (
        <div className="login-page">
            <div className="login-glow" aria-hidden="true" />
            <header className="login-topbar">
                <Link to={ROUTES.home} className="login-back">
                    <ArrowLeftIcon aria-hidden="true" />
                    {t.backToSite}
                </Link>
                <ThemeToggle />
            </header>

            <main className="login-main">
                <div className="login-card glass-panel">
                    <Link to={ROUTES.home} className="login-logo" aria-label="Innopixel">
                        <img src="/images/logo-innopixel-white-text.svg" alt="innopixel" className="logo-dark" />
                        <img src="/images/logo-innopixel.svg" alt="" aria-hidden="true" className="logo-light" />
                    </Link>
                    <h1 className="login-title">{t.title}</h1>
                    <p className="login-subtitle">{t.subtitle}</p>

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
                            <label htmlFor="login-password">{t.password}</label>
                            <div className="input-with-action">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? "login-password-error" : undefined}
                                    disabled={submitting}
                                />
                                <button
                                    type="button"
                                    className="input-action"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
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

                    {USE_MOCK_API && (
                        <section className="demo-accounts" aria-labelledby="demo-title">
                            <h2 id="demo-title">{t.demoTitle}</h2>
                            <p>{t.demoHint(DEMO_PASSWORD)}</p>
                            <ul>
                                {getDemoAccounts().map((account) => (
                                    <li key={account.email}>
                                        <button type="button" className="demo-account" onClick={() => fillDemo(account.email)} disabled={submitting}>
                                            <span className="demo-account-name">{account.name}</span>
                                            <span className="demo-account-meta">
                                                {text.roles[account.role]} · {account.title}
                                            </span>
                                            <span className="demo-account-email">{account.email}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default LoginPage;
