import { useLanguage } from "../../context/LanguageContext";
import { services } from "../../data/services";
import ServiceCard from "./ServiceCard";

function ServicesSection() {
    const { t } = useLanguage();

    return (
        <section className="services-section section-flush">
            <div className="container">
                <div className="services-grid">
                    {services.map(({ key, Icon }) => (
                        <ServiceCard
                            key={key}
                            Icon={Icon}
                            title={t(`servicesPage.${key}Title`)}
                            description={t(`servicesPage.${key}Desc`)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
