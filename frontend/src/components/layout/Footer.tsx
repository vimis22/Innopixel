import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { NAV_ITEMS } from "../../config/routes";
import Logo from "../common/Logo";
import { LinkedInIcon } from "../icons/Icons";

function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <Logo />
                    <p>{t("footer.tagline")}</p>
                </div>

                <div className="footer-links">
                    <h4>{t("footer.headingLinks")}</h4>
                    <ul>
                        {NAV_ITEMS.map((item) => (
                            <li key={item.to}>
                                <Link to={item.to}>{t(item.key)}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="footer-social">
                    <h4>{t("footer.headingFollow")}</h4>
                    <div className="social-icons">
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                            <LinkedInIcon />
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container footer-bottom-container">
                    <p>{t("footer.copyright")}</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
