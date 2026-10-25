import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import { useAppText } from "../../../i18n/app/useAppText";
import ThemeToggle from "../../../components/common/ThemeToggle";
import { ArrowLeftIcon } from "../../../components/icons/AppIcons";
import "../../../styles/app/index.css";

interface AuthCardProps {
    title: string;
    subtitle?: ReactNode;
    children: ReactNode;
    topbar?: ReactNode;          // replaces "Tilbage til hjemmesiden", e.g. a logout button
}

// The page around login, "Glemt adgangskode", reset links and the required password change
function AuthCard({ title, subtitle, children, topbar }: AuthCardProps) {
    const t = useAppText().login;
    return (
        <div className="login-page">
            <div className="login-glow" aria-hidden="true" />
            <header className="login-topbar">
                {topbar ?? (
                    <Link to={ROUTES.home} className="login-back">
                        <ArrowLeftIcon aria-hidden="true" />
                        {t.backToSite}
                    </Link>
                )}
                <ThemeToggle />
            </header>

            <main className="login-main">
                <div className="login-card glass-panel">
                    <Link to={ROUTES.home} className="login-logo" aria-label="Innopixel">
                        <img src="/images/logo-innopixel-white-text.svg" alt="innopixel" className="logo-dark" />
                        <img src="/images/logo-innopixel.svg" alt="" aria-hidden="true" className="logo-light" />
                    </Link>
                    <h1 className="login-title">{title}</h1>
                    {subtitle && <p className="login-subtitle">{subtitle}</p>}
                    {children}
                </div>
            </main>
        </div>
    );
}

export default AuthCard;
