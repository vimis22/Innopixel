import { useId, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { useLanguage, type Language } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import Switch from "../../components/ui/Switch";
import { InfoIcon, LockIcon, LogoutIcon } from "../../components/icons/AppIcons";
import { useAuth } from "../auth/AuthContext";
import { usePreferences, type NotificationPreferences } from "../preferences/PreferencesContext";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import ChangePasswordModal from "./ChangePasswordModal";

// One labelled setting with its control on the right
export function SettingRow({ title, description, children }: { title: string; description?: string; children: (descriptionId: string) => ReactNode }) {
    const descriptionId = useId();
    return (
        <div className="setting-row">
            <div>
                <p className="setting-title">{title}</p>
                {description && <p id={descriptionId} className="small text-secondary">{description}</p>}
            </div>
            {children(descriptionId)}
        </div>
    );
}

export function NotificationsSection() {
    const text = useAppText();
    const t = text.settings;
    const { preferences, update } = usePreferences();
    const rows: { key: keyof NotificationPreferences; title: string; description: string }[] = [
        { key: "taskAssigned", title: t.notifyTaskAssigned, description: t.notifyTaskAssignedSub },
        { key: "deadlines", title: t.notifyDeadlines, description: t.notifyDeadlinesSub },
        { key: "milestones", title: t.notifyMilestones, description: t.notifyMilestonesSub },
        { key: "weekly", title: t.notifyWeekly, description: t.notifyWeeklySub },
    ];

    return (
        <>
            <p className="notice"><InfoIcon aria-hidden="true" />{t.notificationsNote}</p>
            {rows.map((row) => (
                <SettingRow key={row.key} title={row.title} description={row.description}>
                    {(id) => (
                        <Switch
                            checked={preferences.notifications[row.key]}
                            onChange={(checked) => update({ notifications: { ...preferences.notifications, [row.key]: checked } })}
                            label={row.title}
                            describedBy={id}
                        />
                    )}
                </SettingRow>
            ))}
        </>
    );
}

export function AppearanceSection() {
    const t = useAppText().settings;
    const { theme, toggleTheme } = useTheme();
    const { preferences, update } = usePreferences();

    return (
        <>
            <SettingRow title={t.darkMode} description={t.darkModeSub}>
                {(id) => <Switch checked={theme === "dark"} onChange={toggleTheme} label={t.darkMode} describedBy={id} />}
            </SettingRow>
            <SettingRow title={t.compactSidebar} description={t.compactSidebarSub}>
                {(id) => <Switch checked={preferences.sidebarCollapsed} onChange={(checked) => update({ sidebarCollapsed: checked })} label={t.compactSidebar} describedBy={id} />}
            </SettingRow>
        </>
    );
}

// The workspace is Danish only for now; the public website's language can be chosen here
export function LanguageSelect({ id }: { id?: string }) {
    const t = useAppText().settings;
    const { language, setLanguage } = useLanguage();
    return (
        <select id={id} className="control setting-select" value={language} onChange={(e) => setLanguage(e.target.value as Language)} aria-label={t.siteLanguage}>
            <option value="da">{t.danish}</option>
            <option value="en">{t.english}</option>
        </select>
    );
}

export function LanguageSection() {
    const t = useAppText().settings;
    return (
        <>
            <SettingRow title={t.appLanguage} description={t.languageNote}>
                {() => (
                    <select className="control setting-select" value="da" disabled aria-label={t.appLanguage}>
                        <option value="da">{t.danish}</option>
                        <option value="en">{t.englishUnavailable}</option>
                    </select>
                )}
            </SettingRow>
            <SettingRow title={t.siteLanguage} description={t.siteLanguageNote}>
                {() => <LanguageSelect />}
            </SettingRow>
        </>
    );
}

export function SecuritySection() {
    const text = useAppText();
    const t = text.settings;
    const user = useCurrentUser();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [changingPassword, setChangingPassword] = useState(false);

    async function signOut() {
        await logout();
        navigate(ROUTES.login, { replace: true });
    }

    return (
        <>
            <SettingRow title={t.changePassword} description={t.changePasswordSub}>
                {(id) => <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => setChangingPassword(true)} aria-describedby={id}><LockIcon aria-hidden="true" />{t.changePassword}</button>}
            </SettingRow>
            <SettingRow title={t.signedInAs(user.email)} description={t.sessionNote}>
                {() => <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => void signOut()}><LogoutIcon aria-hidden="true" />{text.topbar.logout}</button>}
            </SettingRow>
            {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
        </>
    );
}
