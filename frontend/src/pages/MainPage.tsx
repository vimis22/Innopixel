import { useLanguage } from "../context/LanguageContext";
import { ROUTES } from "../config/routes";
import HeroSection from "../components/home/HeroSection";
import StatsSection from "../components/home/StatsSection";
import StorySection from "../components/common/StorySection";
import ContactCta from "../components/home/ContactCta";

function MainPage() {
    const { t } = useLanguage();

    return (
        <>
            <HeroSection />
            <StatsSection />
            <StorySection
                subtitle={t("homeStory.subtitle")}
                title={t("homeStory.title")}
                paragraphs={[t("homeStory.p1"), t("homeStory.p2")]}
                action={{ to: ROUTES.story, label: t("homeStory.btnStory") }}
            />
            <ContactCta />
        </>
    );
}

export default MainPage;
