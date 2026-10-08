import type { ComponentType } from "react";
import { useLanguage, type Language } from "../../context/LanguageContext";
import { BritishFlagIcon, DanishFlagIcon, type IconProps } from "../icons/Icons";

const languages: { code: Language; label: string; Flag: ComponentType<IconProps> }[] = [
    { code: "da", label: "Dansk", Flag: DanishFlagIcon },
    { code: "en", label: "English", Flag: BritishFlagIcon },
];

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="lang-switcher">
            {languages.map(({ code, label, Flag }) => (
                <button
                    key={code}
                    className={`lang-btn ${language === code ? "active" : ""}`}
                    onClick={() => setLanguage(code)}
                    aria-label={label}
                    title={label}
                >
                    <Flag className="flag-icon" />
                </button>
            ))}
        </div>
    );
}

export default LanguageSwitcher;
