import { useAppText } from "../../i18n/app/useAppText";
import { useLanguage, type Language } from "../../context/LanguageContext";
import { useTheme, type ThemeMode } from "../../context/ThemeContext";
import ChoiceGroup, { type ChoiceOption } from "../../components/ui/ChoiceGroup";
import Switch from "../../components/ui/Switch";
import { MoonIcon, SunIcon } from "../../components/icons/Icons";
import { MonitorIcon } from "../../components/icons/AppIcons";
import { usePreferences } from "../preferences/PreferencesContext";
import { ACCENT_COLORS, TEXT_SIZES, type AccentColor, type Preferences, type TextSize } from "../preferences/preferences";
import { SettingRow } from "./PreferenceSections";

type Toggle = keyof Pick<Preferences, "sidebarCollapsed" | "reduceMotion" | "highContrast">;

/*
 * "Præferencer": appearance, accessibility and language. Every change applies at once (theme via ThemeContext,
 * the rest via useApplyPreferences) and is remembered in this browser.
 */
function PreferencesSection() {
    const t = useAppText().settings;
    const { mode, setMode } = useTheme();
    const { preferences, update } = usePreferences();
    const { language, setLanguage } = useLanguage();

    const themes: ChoiceOption<ThemeMode>[] = [
        { value: "light", label: t.themeLight, description: t.themeLightSub, visual: <SunIcon /> },
        { value: "dark", label: t.themeDark, description: t.themeDarkSub, visual: <MoonIcon /> },
        { value: "system", label: t.themeSystem, description: t.themeSystemSub, visual: <MonitorIcon /> },
    ];
    const accents: ChoiceOption<AccentColor>[] = ACCENT_COLORS.map((accent) => ({
        value: accent,
        label: t.accents[accent],
        visual: <span className="accent-swatch" data-accent={accent} />,
    }));
    const sizes: ChoiceOption<TextSize>[] = TEXT_SIZES.map((size) => ({
        value: size,
        label: t.textSizes[size],
        visual: <span className={`text-size-sample text-size-sample--${size}`}>Aa</span>,
    }));
    const toggles: { key: Toggle; title: string; description: string }[] = [
        { key: "sidebarCollapsed", title: t.compactSidebar, description: t.compactSidebarSub },
        { key: "reduceMotion", title: t.reduceMotion, description: t.reduceMotionSub },
        { key: "highContrast", title: t.highContrast, description: t.highContrastSub },
    ];

    return (
        <>
            <h3 className="settings-group-title">{t.appearance}</h3>
            <SettingRow title={t.theme} description={t.themeSub} stacked>
                {(id) => <ChoiceGroup label={t.theme} variant="card" options={themes} value={mode} onChange={setMode} describedBy={id} />}
            </SettingRow>
            <SettingRow title={t.accent} description={t.accentSub} stacked>
                {(id) => <ChoiceGroup label={t.accent} variant="swatch" options={accents} value={preferences.accent} onChange={(accent) => update({ accent })} describedBy={id} />}
            </SettingRow>
            <SettingRow title={t.textSize} description={t.textSizeSub} stacked>
                {(id) => <ChoiceGroup label={t.textSize} variant="chip" options={sizes} value={preferences.textSize} onChange={(textSize) => update({ textSize })} describedBy={id} />}
            </SettingRow>

            <h3 className="settings-group-title">{t.accessibility}</h3>
            {toggles.map(({ key, title, description }) => (
                <SettingRow key={key} title={title} description={description}>
                    {(id) => <Switch checked={preferences[key]} onChange={(checked) => update({ [key]: checked })} label={title} describedBy={id} />}
                </SettingRow>
            ))}

            <h3 className="settings-group-title">{t.language}</h3>
            {/* Only languages with complete translations are offered: the workspace is Danish for now */}
            <SettingRow title={t.appLanguage} description={t.languageNote}>
                {(id) => (
                    <select className="control setting-select" value="da" disabled aria-label={t.appLanguage} aria-describedby={id}>
                        <option value="da">{t.danish}</option>
                    </select>
                )}
            </SettingRow>
            <SettingRow title={t.siteLanguage} description={t.siteLanguageNote}>
                {(id) => (
                    <select className="control setting-select" value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label={t.siteLanguage} aria-describedby={id}>
                        <option value="da">{t.danish}</option>
                        <option value="en">{t.english}</option>
                    </select>
                )}
            </SettingRow>
        </>
    );
}

export default PreferencesSection;
