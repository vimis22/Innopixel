import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import LoadingState from "../../components/ui/LoadingState";
import { AlertIcon, ArrowLeftIcon } from "../../components/icons/AppIcons";
import { errorMessage } from "../../components/ui/Feedback";
import { useAuth } from "./AuthContext";
import AuthCard from "./components/AuthCard";
import NewPasswordFields from "./components/NewPasswordFields";
import type { LoginNotice } from "./LoginPage";
import { passwordApi, type ResetLinkPurpose } from "./passwordApi";
import { newPasswordError, type NewPasswordError } from "./passwordPolicy";

type LinkState = { kind: "checking" } | { kind: "valid"; purpose: ResetLinkPurpose } | { kind: "invalid"; message: string };

// The token is in the URL fragment (#token=...), which browsers never send to a server
function tokenFromLocation(): string {
    return new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
}

/*
 * The page a reset or invitation link opens. The link is checked first, so an expired or used link says so
 * before anyone types a password. After a reset every session has ended, so the user logs in again.
 */
function ResetPasswordPage() {
    const text = useAppText();
    const t = text.auth.reset;
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [token] = useState(tokenFromLocation);
    const [link, setLink] = useState<LinkState>(() => (token ? { kind: "checking" } : { kind: "invalid", message: t.invalid }));
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<NewPasswordError | null>(null);
    const [failure, setFailure] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Keep the token out of the address bar and the browser history once it has been read
        if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);
        if (!token) return;
        let current = true;
        passwordApi.validateLink(token).then(
            (purpose) => current && setLink({ kind: "valid", purpose }),
            (err: unknown) => current && setLink({ kind: "invalid", message: errorMessage(err, t.invalid) }),
        );
        return () => {
            current = false;
        };
    }, [token, t.invalid]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFailure(null);
        const problem = newPasswordError(password, confirmation);
        setError(problem);
        if (problem) return;

        setSaving(true);
        try {
            await passwordApi.resetPassword(token, password);
            // The server ended every session; drop a session that may be open in this browser too
            if (user) await logout();
            navigate(ROUTES.login, { replace: true, state: { notice: "passwordReset" } satisfies LoginNotice });
        } catch (err) {
            // An expired or used link can't be fixed by retrying; a weak password can
            const message = errorMessage(err, text.common.genericError);
            if ([t.expired, t.used, t.invalid].includes(message)) setLink({ kind: "invalid", message });
            else setFailure(message);
            setSaving(false);
        }
    }

    const back = (
        <Link to={ROUTES.login} className="login-back">
            <ArrowLeftIcon aria-hidden="true" />
            {text.auth.forgot.backToLogin}
        </Link>
    );

    if (link.kind === "checking") return <LoadingState fullscreen label={t.checking} />;

    if (link.kind === "invalid") {
        return (
            <AuthCard title={t.invalidTitle} topbar={back}>
                <div className="form-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{link.message}</span>
                </div>
                <p className="small text-secondary auth-help">{t.invalidHelp}</p>
                <Link to={ROUTES.forgotPassword} className="app-btn app-btn--primary app-btn--block app-btn--lg">{t.requestNew}</Link>
            </AuthCard>
        );
    }

    const invite = link.purpose === "INVITE";
    return (
        <AuthCard title={invite ? t.inviteTitle : t.title} subtitle={invite ? t.inviteSubtitle : t.subtitle} topbar={back}>
            {failure && (
                <div className="form-alert" role="alert">
                    <AlertIcon aria-hidden="true" />
                    <span>{failure}</span>
                </div>
            )}
            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <NewPasswordFields
                    idPrefix="reset"
                    password={password}
                    confirmation={confirmation}
                    onPasswordChange={setPassword}
                    onConfirmationChange={setConfirmation}
                    error={error}
                    disabled={saving}
                    autoFocus
                />
                <button type="submit" className="app-btn app-btn--primary app-btn--block app-btn--lg" disabled={saving}>
                    {saving ? <><span className="spinner btn-spinner" aria-hidden="true" />{text.common.saving}</> : invite ? t.submitInvite : t.submit}
                </button>
            </form>
        </AuthCard>
    );
}

export default ResetPasswordPage;
