import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppText } from "../../i18n/app/useAppText";
import type { AppText } from "../../i18n/app/da";
import { useTheme } from "../../context/ThemeContext";
import PageHeader from "../../components/ui/PageHeader";
import Panel from "../../components/ui/Panel";
import Switch from "../../components/ui/Switch";
import type { IconProps } from "../../components/icons/Icons";
import { MailIcon, MoonIcon } from "../../components/icons/Icons";
import { BellIcon, GlobeIcon, MonitorIcon, ShieldIcon, UserIcon } from "../../components/icons/AppIcons";
import { usePreferences } from "../preferences/PreferencesContext";
import ProfileSection from "./ProfileSection";
import { AppearanceSection, LanguageSection, LanguageSelect, NotificationsSection, SecuritySection, SettingRow } from "./PreferenceSections";
import "./settings.css";

type SectionKey = "profile" | "notifications" | "appearance" | "language" | "security";

interface Section {
    key: SectionKey;
    Icon: ComponentType<IconProps>;
    title: (t: AppText["settings"]) => string;
    subtitle: (t: AppText["settings"]) => string;
    lead: (t: AppText["settings"]) => string;
    Content: ComponentType;
}

const SECTIONS: Section[] = [
    { key: "profile", Icon: UserIcon, title: (t) => t.profile, subtitle: (t) => t.profileSub, lead: (t) => t.profileLead, Content: ProfileSection },
    { key: "notifications", Icon: BellIcon, title: (t) => t.notifications, subtitle: (t) => t.notificationsSub, lead: (t) => t.notificationsLead, Content: NotificationsSection },
    { key: "appearance", Icon: MonitorIcon, title: (t) => t.appearance, subtitle: (t) => t.appearanceSub, lead: (t) => t.appearanceLead, Content: AppearanceSection },
    { key: "language", Icon: GlobeIcon, title: (t) => t.language, subtitle: (t) => t.languageSub, lead: (t) => t.languageLead, Content: LanguageSection },
    { key: "security", Icon: ShieldIcon, title: (t) => t.security, subtitle: (t) => t.securitySub, lead: (t) => t.securityLead, Content: SecuritySection },
];

// The most used preferences, always at hand next to the current section
function QuickSettings() {
    const t = useAppText().settings;
    const { theme, toggleTheme } = useTheme();
    const { preferences, update } = usePreferences();
    const emailOn = preferences.notifications.taskAssigned || preferences.notifications.deadlines;

    return (
        <Panel title={t.quick} subtitle={t.quickLead}>
            <div className="quick-settings">
                <div className="quick-setting">
                    <span className="quick-icon" aria-hidden="true"><MoonIcon /></span>
                    <SettingRow title={t.darkMode} description={t.darkModeSub}>
                        {(id) => <Switch checked={theme === "dark"} onChange={toggleTheme} label={t.darkMode} describedBy={id} />}
                    </SettingRow>
                </div>
                <div className="quick-setting">
                    <span className="quick-icon" aria-hidden="true"><MailIcon /></span>
                    <SettingRow title={t.emailNotifications} description={t.emailNotificationsSub}>
                        {(id) => (
                            <Switch
                                checked={emailOn}
                                onChange={(checked) => update({ notifications: { ...preferences.notifications, taskAssigned: checked, deadlines: checked } })}
                                label={t.emailNotifications}
                                describedBy={id}
                            />
                        )}
                    </SettingRow>
                </div>
                <div className="quick-setting">
                    <span className="quick-icon" aria-hidden="true"><GlobeIcon /></span>
                    <SettingRow title={t.siteLanguage} description={t.languageSub}>
                        {() => <LanguageSelect />}
                    </SettingRow>
                </div>
            </div>
        </Panel>
    );
}

function SettingsPage() {
    const text = useAppText();
    const t = text.settings;
    const [params, setParams] = useSearchParams();
    const active = SECTIONS.find((s) => s.key === params.get("section")) ?? SECTIONS[0];
    const { Content } = active;

    return (
        <div className="page">
            <PageHeader title={t.title} lead={t.lead} />

            <div className="settings-layout">
                <nav className="panel settings-nav" aria-label={t.sectionsLabel}>
                    {SECTIONS.map(({ key, Icon, title, subtitle }) => (
                        <button
                            key={key}
                            type="button"
                            className={`settings-nav-item ${active.key === key ? "is-active" : ""}`}
                            aria-current={active.key === key ? "page" : undefined}
                            onClick={() => setParams(key === "profile" ? {} : { section: key }, { replace: true })}
                        >
                            <Icon className="settings-nav-icon" aria-hidden="true" />
                            <span className="cell-text">
                                <span className="settings-nav-title">{title(t)}</span>
                                <span className="small text-secondary">{subtitle(t)}</span>
                            </span>
                        </button>
                    ))}
                </nav>

                <Panel title={active.title(t)} subtitle={active.lead(t)} className="settings-content">
                    <Content />
                </Panel>

                <QuickSettings />
            </div>
        </div>
    );
}

export default SettingsPage;
