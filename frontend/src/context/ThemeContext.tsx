import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
// "system" follows the operating system and is what you get until you choose a theme
export type ThemeMode = Theme | "system";

interface ThemeContextValue {
    theme: Theme;
    mode: ThemeMode;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function systemTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getInitialMode(): ThemeMode {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
    const [system, setSystem] = useState<Theme>(systemTheme);
    const theme = mode === "system" ? system : mode;

    useEffect(() => {
        if (theme === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }, [theme]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: light)");

        function handleChange(event: MediaQueryListEvent) {
            setSystem(event.matches ? "light" : "dark");
        }

        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    function setMode(next: ThemeMode) {
        setModeState(next);
        if (next === "system") localStorage.removeItem("theme");
        else localStorage.setItem("theme", next);
    }

    function toggleTheme() {
        setMode(theme === "light" ? "dark" : "light");
    }

    return (
        <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react/only-export-components
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used inside <ThemeProvider>");
    }
    return context;
}
