import type { ComponentType } from "react";
import type { IconProps } from "../icons/Icons";
import TiltCard from "../common/TiltCard";

interface ServiceCardProps {
    Icon: ComponentType<IconProps>;
    title: string;
    description: string;
}

function ServiceCard({ Icon, title, description }: ServiceCardProps) {
    return (
        <TiltCard className="service-card glow-effect">
            <div className="service-icon-wrapper">
                <Icon className="service-icon" strokeWidth={1.5} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
        </TiltCard>
    );
}

export default ServiceCard;
