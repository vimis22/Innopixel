import { useLanguage } from "../../context/LanguageContext";
import HighlightText from "./HighlightText";

interface PageBannerProps {
    // Section in translations.json that has bannerSubtitle, bannerTitle and bannerDesc
    i18nKey: string;
}

function PageBanner({ i18nKey }: PageBannerProps) {
    const { t } = useLanguage();

    return (
        <section className="page-banner">
            <div className="container">
                <div className="section-subtitle">{t(`${i18nKey}.bannerSubtitle`)}</div>
                <h1>
                    <HighlightText text={t(`${i18nKey}.bannerTitle`)} />
                </h1>
                <p>{t(`${i18nKey}.bannerDesc`)}</p>
            </div>
        </section>
    );
}

export default PageBanner;
