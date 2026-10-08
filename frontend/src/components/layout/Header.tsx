import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../features/auth/AuthContext";
import { useScrolled } from "../../hooks/useScrolled";
import { APP_ROUTES, NAV_ITEMS, ROUTES } from "../../config/routes";
import { UserIcon } from "../icons/AppIcons";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";
import LanguageSwitcher from "../common/LanguageSwitcher";

function Header() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const scrolled = useScrolled(50);
    const [menuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    // Close the mobile menu when clicking outside the header
    useEffect(() => {
        if (!menuOpen) return;

        function handleClick(event: MouseEvent) {
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [menuOpen]);

    const closeMenu = () => setMenuOpen(false);

    return (
        <header ref={headerRef} className={`header ${scrolled ? "header-scrolled" : ""}`}>
            <div className="container header-container">
                <Logo onClick={closeMenu} />

                <nav className={`nav ${menuOpen ? "open" : ""}`}>
                    {/* NavLink adds the "active" class automatically on the current page */}
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.to} to={item.to} end className="nav-link" onClick={closeMenu}>
                            {t(item.key)}
                        </NavLink>
                    ))}
                    <NavLink to={ROUTES.contact} className="nav-link nav-btn" onClick={closeMenu}>
                        {t("nav.contact")}
                    </NavLink>
                    {/* Entry to the internal platform; signed-in users go straight to their workspace */}
                    <Link to={user ? APP_ROUTES.dashboard : ROUTES.login} className="nav-link nav-login" onClick={closeMenu}>
                        <UserIcon className="nav-login-icon" aria-hidden="true" />
                        {t(user ? "nav.workspace" : "nav.login")}
                    </Link>
                    <ThemeToggle />
                    <LanguageSwitcher />
                </nav>

                <button
                    className={`mobile-nav-toggle ${menuOpen ? "open" : ""}`}
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </header>
    );
}

export default Header;
