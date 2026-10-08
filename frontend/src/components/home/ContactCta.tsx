import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { ROUTES } from "../../config/routes";
import SectionHeading from "../common/SectionHeading";

function ContactCta() {
    const { t } = useLanguage();

    return (
        <section className="contact-section contact-cta">
            <div className="container">
                <SectionHeading subtitle={t("contactPage.bannerSubtitle")} title={t("homeCta.title")} />
                <p className="contact-cta-text">{t("homeCta.description")}</p>
                <Link to={ROUTES.contact} className="btn btn-primary">
                    {t("homeCta.btnContact")} &rarr;
                </Link>
            </div>
        </section>
    );
}

export default ContactCta;
