import PageBanner from "../components/common/PageBanner";
import ContactSection from "../components/contact/ContactSection";

function Contact() {
    return (
        <>
            <PageBanner i18nKey="contactPage" />
            <ContactSection />
        </>
    );
}

export default Contact;
