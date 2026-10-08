import { useState, type ChangeEvent, type FormEvent } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { CheckCircleIcon } from "../icons/Icons";

interface FormData {
    name: string;
    email: string;
    message: string;
}

const emptyForm: FormData = { name: "", email: "", message: "" };

function ContactForm() {
    const { t } = useLanguage();
    const [form, setForm] = useState<FormData>(emptyForm);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // One handler for all fields: the input's id matches the key in FormData
    function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { id, value } = event.target;
        setForm((prev) => ({ ...prev, [id]: value }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSending(true);

        // Simulated request. Later: await api.post("/contact", form)
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setForm(emptyForm);
        }, 1200);
    }

    return (
        <div className="contact-form-wrapper glass-panel glow-effect">
            {sent ? (
                <div className="form-success-message">
                    <CheckCircleIcon className="success-icon" />
                    <h3>{t("contactPage.successTitle")}</h3>
                    <p>{t("contactPage.successText")}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSent(false)}>
                        {t("contactPage.btnReset")}
                    </button>
                </div>
            ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">{t("contactPage.formName")}</label>
                        <input
                            type="text"
                            id="name"
                            required
                            placeholder={t("contactPage.formNamePlaceholder")}
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">{t("contactPage.formEmail")}</label>
                        <input
                            type="email"
                            id="email"
                            required
                            placeholder={t("contactPage.formEmailPlaceholder")}
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">{t("contactPage.formMessage")}</label>
                        <textarea
                            id="message"
                            required
                            placeholder={t("contactPage.formMessagePlaceholder")}
                            value={form.message}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                        {sending ? (
                            <span className="spinner btn-spinner" />
                        ) : (
                            t("contactPage.btnSend")
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

export default ContactForm;
