import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import translations from "../i18n/translations.json";

export type Language = "da" | "en";

interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
    tList: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
    const saved = localStorage.getItem("lang");
    return saved === "en" ? "en" : "da";
}

// Looks up "nav.home" → translations[language].nav.home
function getNestedValue(obj: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>(
        (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
        obj,
    );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(getInitialLanguage);

    useEffect(() => {
        document.documentElement.setAttribute("lang", language);
    }, [language]);

    function setLanguage(next: Language) {
        setLanguageState(next);
        localStorage.setItem("lang", next);
    }

    // Returns the key itself if the text is missing, so gaps are easy to spot
    function t(key: string): string {
        const value = getNestedValue(translations[language], key);
        return typeof value === "string" ? value : key;
    }

    // For array values such as project tags
    function tList(key: string): string[] {
        const value = getNestedValue(translations[language], key);
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, tList }}>
            {children}
        </LanguageContext.Provider>
    );
}

// eslint-disable-next-line react/only-export-components
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used inside <LanguageProvider>");
    }
    return context;
}
