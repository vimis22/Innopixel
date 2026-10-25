import { useEffect, useState } from "react";
import type { User, UserAccount } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { formatDateTime } from "../../utils/date";
import { Pill } from "../../components/ui/Badges";
import { ErrorState } from "../../components/ui/States";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { InfoIcon, LockIcon, RefreshIcon } from "../../components/icons/AppIcons";
import { MailIcon } from "../../components/icons/Icons";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import { accountApi } from "./accountApi";
import SendResetEmailDialog from "./SendResetEmailDialog";
import TemporaryPasswordDialog from "./TemporaryPasswordDialog";

// The login details from the server, reloaded after every change made here
// active: the account status as the workspace knows it; a change (here or elsewhere) reloads too
function useAccount(userId: string, version: number, active: boolean) {
    const [account, setAccount] = useState<{ userId: string; data: UserAccount } | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let current = true;
        accountApi.get(userId).then(
            (data) => current && (setAccount({ userId, data }), setFailed(false)),
            () => current && setFailed(true),
        );
        return () => {
            current = false;
        };
    }, [userId, version, active, attempt]);
    return { account: account?.userId === userId ? account.data : null, failed, retry: () => setAttempt((a) => a + 1) };
}

/*
 * "Adgang": account status, login details and the two ways to help someone who can't log in.
 * Existing passwords are never fetched or shown; the server enforces every rule again.
 */
function EmployeeAccessTab({ user }: { user: User }) {
    const text = useAppText();
    const t = text.team;
    const a = t.access;
    const me = useCurrentUser();
    const { actions } = useWorkspaceData();
    const { confirm } = useFeedback();
    const run = useRunAction();
    const [version, setVersion] = useState(0);
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState<"temporary" | "reset" | null>(null);
    const { account, failed, retry } = useAccount(user.id, version, user.active);
    const self = user.id === me.id;
    const reload = () => setVersion((v) => v + 1);

    async function toggleActive() {
        if (user.active) {
            const yes = await confirm({ title: t.deactivateTitle, message: t.deactivateMessage(user.name), confirmLabel: t.deactivate, danger: true });
            if (!yes) return;
        }
        setBusy(true);
        await run(() => actions.setUserActive(user.id, !user.active), t.updated_toast);
        setBusy(false);
    }

    if (failed) return <ErrorState title={a.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{text.common.retry}</button>} />;
    if (!account) return <div className="time-table-loading" aria-hidden="true" />;

    const canManage = !self && user.active;
    return (
        <div className="stack">
            <section className="detail-section">
                <div className="access-heading">
                    <h3 className="detail-section-title">{a.statusTitle}</h3>
                    <Pill tone={account.active ? "success" : "neutral"}>{account.active ? a.activeAccount : a.inactiveAccount}</Pill>
                </div>
                <dl className="detail-facts">
                    <div><dt>{t.email}</dt><dd>{account.email}</dd></div>
                    <div><dt>{t.role}</dt><dd>{text.roles[account.role]}</dd></div>
                    <div>
                        <dt>{t.status}</dt>
                        <dd>
                            <span className="status-dot-label">
                                <span className={`dot ${account.active ? "dot--success" : "dot--muted"}`} aria-hidden="true" />
                                {account.active ? t.active : t.inactive}
                            </span>
                        </dd>
                    </div>
                    <div><dt>{a.temporaryInUse}</dt><dd>{account.mustChangePassword ? <Pill tone="warning">{a.yesMustChange}</Pill> : a.no}</dd></div>
                    <div><dt>{a.lastLogin}</dt><dd>{account.lastLoginAt ? formatDateTime(account.lastLoginAt) : <span className="muted">{a.neverLoggedIn}</span>}</dd></div>
                </dl>
            </section>

            {self ? (
                <p className="notice"><InfoIcon aria-hidden="true" />{t.ownAccount}</p>
            ) : (
                <section className="detail-section">
                    <h3 className="detail-section-title">{t.passwordTitle}</h3>
                    <div className="access-action">
                        <span className="access-action-icon" aria-hidden="true"><LockIcon /></span>
                        <div className="access-action-text">
                            <strong>{a.temporaryTitle}</strong>
                            <span>{a.temporaryDescription}</span>
                        </div>
                        <button type="button" className="app-btn app-btn--outline app-btn--sm" disabled={!canManage} onClick={() => setDialog("temporary")}>
                            {a.temporaryTitle}
                        </button>
                    </div>
                    <div className="access-action">
                        <span className="access-action-icon access-action-icon--info" aria-hidden="true"><MailIcon /></span>
                        <div className="access-action-text">
                            <strong>{a.resetTitle}</strong>
                            <span>{account.emailConfigured ? a.resetDescription : a.emailNotConfiguredHint}</span>
                        </div>
                        <button type="button" className="app-btn app-btn--ghost app-btn--sm" disabled={!canManage || !account.emailConfigured} onClick={() => setDialog("reset")}>
                            {a.resetTitle}
                        </button>
                    </div>
                    {!user.active && <p className="field-hint">{a.inactiveHint}</p>}
                    <p className="field-hint">{t.passwordHint}</p>
                </section>
            )}

            {!self && (
                <section className="detail-section">
                    <h3 className="detail-section-title">{t.accountStatus}</h3>
                    <div className="setting-row">
                        <p className="small text-secondary">{user.active ? t.accountActive : t.accountInactive}</p>
                        <button
                            type="button"
                            className={`app-btn app-btn--sm ${user.active ? "app-btn--danger-ghost" : "app-btn--ghost"}`}
                            onClick={() => void toggleActive()}
                            disabled={busy}
                        >
                            {user.active ? <LockIcon aria-hidden="true" /> : <RefreshIcon aria-hidden="true" />}
                            {user.active ? t.deactivate : t.activate}
                        </button>
                    </div>
                </section>
            )}

            <section className="detail-section">
                <h3 className="detail-section-title">{t.permissionsTitle}</h3>
                <p className="small text-secondary">{user.role === "ADMIN" ? t.roleAdminHint : t.roleEmployeeHint}</p>
                <p className="field-hint">{t.roleChangeHint}</p>
            </section>

            {dialog === "temporary" && <TemporaryPasswordDialog user={user} onClose={() => setDialog(null)} onSaved={reload} />}
            {dialog === "reset" && <SendResetEmailDialog user={user} onClose={() => { setDialog(null); reload(); }} />}
        </div>
    );
}

export default EmployeeAccessTab;
