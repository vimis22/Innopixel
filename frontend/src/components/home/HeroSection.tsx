import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { ROUTES } from "../../config/routes";
import HighlightText from "../common/HighlightText";

function HeroSection() {
    const { t } = useLanguage();

    return (
        <section id="hjem" className="hero-section">
            <div className="container hero-container">
                <div className="hero-content">
                    <div className="tag-badge">{t("hero.badge")}</div>
                    <h1 className="hero-title">
                        <HighlightText text={t("hero.title")} />
                    </h1>
                    <p className="hero-description">{t("hero.description")}</p>
                    <div className="hero-actions">
                        <Link to={ROUTES.projects} className="btn btn-primary">{t("hero.btnProjects")}</Link>
                        <Link to={ROUTES.services} className="btn btn-secondary">{t("hero.btnServices")}</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="image-wrapper glow-effect">
                        <img src="/images/hero_xr_visual.jpg" alt="Futuristic XR Headset Concept" className="hero-img" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
