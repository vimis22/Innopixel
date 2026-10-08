import { useLanguage } from "../context/LanguageContext";
import PageBanner from "../components/common/PageBanner";
import StorySection from "../components/common/StorySection";

function History() {
    const { t } = useLanguage();

    return (
        <>
            <PageBanner i18nKey="storyPage" />
            <StorySection
                plain
                animateVisual
                subtitle={t("storyPage.h2Handcraft")}
                title={t("storyPage.h2Philosophy")}
                paragraphs={[
                    t("storyPage.pHandcraft1"),
                    t("storyPage.pHandcraft2"),
                    t("storyPage.pPhilosophy"),
                    t("storyPage.pStudio"),
                ]}
            />
        </>
    );
}

export default History;
