import ContactInfo from "./ContactInfo";
import ContactForm from "./ContactForm";

function ContactSection() {
    return (
        <section className="contact-section section-flush">
            <div className="container contact-container">
                <ContactInfo />
                <ContactForm />
            </div>
        </section>
    );
}

export default ContactSection;
