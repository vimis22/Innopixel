import type { ComponentType } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { fetchServices, usePublicContent } from "../../services/publicContent";
import { BrowserIcon, CodeIcon, CubeIcon, MapPinIcon, type IconProps } from "../icons/Icons";
import ServiceCard from "./ServiceCard";

// SERVICES.ICONIDENTIFIER in the database -> icon
const ICONS: Record<string, ComponentType<IconProps>> = {
    vr: CubeIcon,
    ar: MapPinIcon,
    modeling: CodeIcon,
    web: BrowserIcon,
};

function ServicesSection() {
    const { t, language } = useLanguage();
    const { items: services, loading, failed } = usePublicContent(fetchServices, language);

    return (
        <section className="services-section section-flush">
            <div className="container">
                {failed && services.length === 0 ? (
                    <p className="content-status" role="alert">{t("servicesPage.loadError")}</p>
                ) : loading && services.length === 0 ? (
                    <p className="content-status" aria-live="polite">{t("servicesPage.loading")}</p>
                ) : (
                    <div className="services-grid">
                        {services.map((service) => (
                            <ServiceCard
                                key={service.id}
                                Icon={ICONS[service.icon] ?? CubeIcon}
                                title={service.title}
                                description={service.description}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default ServicesSection;
