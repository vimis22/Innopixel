import { useId, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import Switch from "../../components/ui/Switch";
import { InfoIcon, LockIcon, LogoutIcon } from "../../components/icons/AppIcons";
import { useAuth } from "../auth/AuthContext";
import { usePreferences, type NotificationPreferences } from "../preferences/PreferencesContext";
import { useCurrentUser } from "../workspace/WorkspaceContext";
import ChangePasswordModal from "./ChangePasswordModal";

// One labelled setting with its control on the right, or below it (stacked) for wide controls such as cards
export function SettingRow({ title, description, children, stacked = false }: {
    title: string;
    description?: string;
    children?: (descriptionId: string) => ReactNode;
    stacked?: boolean;
}) {
    const descriptionId = useId();
    return (
        <div className={`setting-row ${stacked ? "setting-row--stacked" : ""}`}>
            <div>
                <p className="setting-title">{title}</p>
                {description && <p id={descriptionId} className="small text-secondary">{description}</p>}
            </div>
            {children?.(descriptionId)}
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
        { key: "projectChanges", title: t.notifyProjectChanges, description: t.notifyProjectChangesSub },
        { key: "milestones", title: t.notifyMilestones, description: t.notifyMilestonesSub },
        { key: "timeTracking", title: t.notifyTimeTracking, description: t.notifyTimeTrackingSub },
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
            <SettingRow title={t.forgotPassword} description={t.forgotPasswordSub} />
            <SettingRow title={t.signedInAs(user.email)} description={`${text.roles[user.role]} · ${t.sessionNote}`}>
                {() => <button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={() => void signOut()}><LogoutIcon aria-hidden="true" />{text.topbar.logout}</button>}
            </SettingRow>
            <p className="field-hint">{t.securityNote}</p>
            {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
        </>
    );
}
