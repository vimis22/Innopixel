import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "../icons/Icons";

interface ContactDetailItemProps {
    Icon: ComponentType<IconProps>;
    title: string;
    children: ReactNode;
}

function ContactDetailItem({ Icon, title, children }: ContactDetailItemProps) {
    return (
        <div className="contact-detail-item">
            <div className="contact-icon">
                <Icon />
            </div>
            <div>
                <h4>{title}</h4>
                {children}
            </div>
        </div>
    );
}

export default ContactDetailItem;
