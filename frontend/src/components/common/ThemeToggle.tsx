import { useTheme } from "../../context/ThemeContext";
import { MoonIcon, SunIcon } from "../icons/Icons";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const label = theme === "light" ? "Skift til mørk tilstand" : "Skift til lys tilstand";

    // Both icons are always rendered; style.css shows the right one based on data-theme
    return (
        <button className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
            <SunIcon className="icon-sun" />
            <MoonIcon className="icon-moon" />
        </button>
    );
}

export default ThemeToggle;
