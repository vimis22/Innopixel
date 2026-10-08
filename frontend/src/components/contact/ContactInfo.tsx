import { useLanguage } from "../../context/LanguageContext";
import AnimateOnScroll from "../common/AnimateOnScroll";
import { DocumentIcon, MailIcon, MapPinIcon } from "../icons/Icons";
import ContactDetailItem from "./ContactDetailItem";

function ContactInfo() {
    const { t } = useLanguage();

    return (
        <AnimateOnScroll className="contact-info">
            <h2 className="section-title">{t("contactPage.headingDetails")}</h2>
            <p className="contact-lead">{t("contactPage.leadDesc")}</p>

            <div className="contact-details">
                <ContactDetailItem Icon={MailIcon} title={t("contactPage.emailTitle")}>
                    <a href="mailto:hello@innopixel.dk">hello@innopixel.dk</a>
                </ContactDetailItem>
                <ContactDetailItem Icon={MapPinIcon} title={t("contactPage.addressTitle")}>
                    <p>{t("contactPage.addressText")}</p>
                </ContactDetailItem>
                <ContactDetailItem Icon={DocumentIcon} title={t("contactPage.cvrTitle")}>
                    <p>Innopixel ApS &bull; CVR: 38861840 &bull; Odense NV</p>
                </ContactDetailItem>
            </div>
        </AnimateOnScroll>
    );
}

export default ContactInfo;
