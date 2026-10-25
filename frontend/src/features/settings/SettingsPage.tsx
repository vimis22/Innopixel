import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppText } from "../../i18n/app/useAppText";
import type { AppText } from "../../i18n/app/da";
import PageHeader from "../../components/ui/PageHeader";
import Panel from "../../components/ui/Panel";
import type { IconProps } from "../../components/icons/Icons";
import { BellIcon, MonitorIcon, ShieldIcon, UserIcon } from "../../components/icons/AppIcons";
import ProfileSection from "./ProfileSection";
import { NotificationsSection, SecuritySection } from "./PreferenceSections";
import PreferencesSection from "./PreferencesSection";
import "./settings.css";

type SectionKey = "profile" | "notifications" | "preferences" | "security";

interface Section {
    key: SectionKey;
    Icon: ComponentType<IconProps>;
    title: (t: AppText["settings"]) => string;
    subtitle: (t: AppText["settings"]) => string;
    lead: (t: AppText["settings"]) => string;
    Content: ComponentType;
}

// Four sections; only the selected one is shown, and every setting lives in exactly one place
const SECTIONS: Section[] = [
    { key: "profile", Icon: UserIcon, title: (t) => t.profile, subtitle: (t) => t.profileSub, lead: (t) => t.profileLead, Content: ProfileSection },
    { key: "notifications", Icon: BellIcon, title: (t) => t.notifications, subtitle: (t) => t.notificationsSub, lead: (t) => t.notificationsLead, Content: NotificationsSection },
    { key: "preferences", Icon: MonitorIcon, title: (t) => t.preferences, subtitle: (t) => t.preferencesSub, lead: (t) => t.preferencesLead, Content: PreferencesSection },
    { key: "security", Icon: ShieldIcon, title: (t) => t.security, subtitle: (t) => t.securitySub, lead: (t) => t.securityLead, Content: SecuritySection },
];

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
                            onClick={() => setParams(key === "profile" ? {} : { section: key })}
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
            </div>
        </div>
    );
}

export default SettingsPage;
