import { useMemo, useState } from "react";
import type { ISODate, Project, User } from "../../types/domain";
import type { TimeRegistration, TimeStatus } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import PillTabs from "../../components/ui/PillTabs";
import { UserChip } from "../../components/ui/Avatar";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CheckIcon, InfoIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate } from "../../utils/date";
import RegistrationDrawer from "./RegistrationDrawer";
import { TimeStatusPill } from "./TimeStatusPill";
import { formatClock, formatHours, numericDate } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useRegistrationsFor } from "./useRegistrations";
import { useTimeQuery } from "./useTimeQuery";

const HISTORY_DAYS = 31;
type Decision = Exclude<TimeStatus, "ACTIVE">;

interface ApprovalsTabProps {
    me: User;
    admin: boolean;
    users: User[];               // everyone (names of deactivated employees still show on their registrations)
    today: ISODate;
    projects: Project[];
    refresh: number;
    onChanged: () => void;
}

/*
 * "Godkendelser": finished registrations waiting for an administrator, and earlier decisions.
 * Administrators approve or reject (and may change a decision later); employees follow their own.
 * The server only knows the registration itself: no request types, rejection reasons or the value
 * before a correction are stored yet.
 */
function ApprovalsTab({ me, admin, users, today, projects, refresh, onChanged }: ApprovalsTabProps) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const { confirm } = useFeedback();
    const [decision, setDecision] = useState<Decision>("PENDING");
    const [userId, setUserId] = useState("");
    const [opened, setOpened] = useState<TimeRegistration | null>(null);
    const [busy, setBusy] = useState(false);

    const from = addDays(today, -(HISTORY_DAYS - 1));
    const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
    const ids = useMemo(() => (admin ? activeUsers.map((u) => u.id) : [me.id]), [admin, activeUsers, me.id]);
    const pending = useTimeQuery(() => (admin ? timeApi.pending() : Promise.resolve(null)), [admin, refresh]);
    const history = useRegistrationsFor(ids, from, today, refresh);
    const usersById = new Map(users.map((u) => [u.id, u]));

    const recent = history.data ? [...history.data.byUser.values()].flat() : null;
    // Pending from the dedicated endpoint (any date); decisions from the last 31 days
    const lists: Record<Decision, TimeRegistration[] | null> = {
        PENDING: admin ? pending.data : recent?.filter((r) => r.status === "PENDING") ?? null,
        APPROVED: recent?.filter((r) => r.status === "APPROVED") ?? null,
        REJECTED: recent?.filter((r) => r.status === "REJECTED") ?? null,
    };
    const list = lists[decision]?.filter((r) => !userId || r.userId === userId).sort((a, b) => b.clockIn.localeCompare(a.clockIn)) ?? null;
    const failed = (decision === "PENDING" && admin ? pending.failed : history.failed);

    async function decide(registrations: TimeRegistration[], approved: boolean) {
        if (registrations.length === 0) return;
        const many = registrations.length > 1;
        if (many || !approved) {
            const yes = await confirm(approved
                ? { title: t.approveAllTitle, message: t.approveAllMessage(registrations.length), confirmLabel: t.approveAll }
                : { title: t.rejectTitle, message: t.rejectMessage(usersById.get(registrations[0].userId)?.name ?? "", numericDate(registrations[0].date)), confirmLabel: t.reject, danger: true });
            if (!yes) return;
        }
        setBusy(true);
        let done = 0;
        await run(async () => {
            for (const r of registrations) {
                await timeApi.setApproval(r.id, approved);
                done++;
            }
        });
        setBusy(false);
        if (done > 0) onChanged();
    }

    const count = (key: Decision) => lists[key]?.filter((r) => !userId || r.userId === userId).length;

    return (
        <div className="stack">
            <div className="toolbar">
                <PillTabs
                    label={t.status.PENDING}
                    value={decision}
                    onChange={setDecision}
                    options={[
                        { value: "PENDING", label: t.approvalsPending, count: count("PENDING") },
                        { value: "APPROVED", label: t.approvalsApproved, count: count("APPROVED") },
                        { value: "REJECTED", label: t.approvalsRejected, count: count("REJECTED") },
                    ]}
                />
                {admin && (
                    <select className="control" aria-label={t.employee} value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">{t.allEmployees}</option>
                        {activeUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                )}
                {admin && decision === "PENDING" && list && list.length > 1 && (
                    <button type="button" className="app-btn app-btn--primary app-btn--sm toolbar-end" disabled={busy} onClick={() => void decide(list, true)}>
                        <CheckIcon aria-hidden="true" /> {t.approveAllCount(list.length)}
                    </button>
                )}
            </div>

            <Panel flush subtitle={decision === "PENDING" ? (admin ? t.pendingAdminHint : t.pendingOwnHint2) : t.historyHint(HISTORY_DAYS)}>
                {failed ? (
                    <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={decision === "PENDING" && admin ? pending.retry : history.retry}>{t.retry}</button>} />
                ) : list === null ? (
                    <div className="time-table-loading" aria-hidden="true" />
                ) : list.length === 0 ? (
                    <EmptyState Icon={CheckIcon} title={decision === "PENDING" ? t.noPending : t.noDecisions} compact />
                ) : (
                    <div className="table-wrap">
                        <table className="table approvals-table">
                            <thead>
                                <tr>
                                    {admin && <th scope="col">{t.employee}</th>}
                                    <th scope="col">{t.colDate}</th>
                                    <th scope="col">{t.colRegistered}</th>
                                    <th scope="col" className="num">{t.colHours}</th>
                                    <th scope="col">{t.colRemarks}</th>
                                    <th scope="col">{t.colStatus}</th>
                                    {admin && <th scope="col" className="col-actions">{text.team.colActions}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((r) => (
                                    <tr key={r.id} className="is-clickable" onClick={() => setOpened(r)}>
                                        {admin && <td><UserChip user={usersById.get(r.userId)} fallback="–" /></td>}
                                        <td className="nowrap">
                                            <button type="button" className="cell-title time-row-button" onClick={(e) => { e.stopPropagation(); setOpened(r); }}>{formatDate(r.date)}</button>
                                        </td>
                                        <td className="nowrap">
                                            {formatClock(r.clockIn)}–{r.clockOut ? formatClock(r.clockOut) : "…"}
                                            <span className="muted"> · {t.colBreak.toLowerCase()} {t.minutesShort(r.breakMinutes)}</span>
                                        </td>
                                        <td className="num">{formatHours(r.workedMinutes)}</td>
                                        <td className="approvals-remarks">{r.remarks ? <span className="truncate" title={r.remarks}>{r.remarks}</span> : <span className="muted">–</span>}</td>
                                        <td><TimeStatusPill status={r.status} /></td>
                                        {admin && (
                                            <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                                                <span className="row-actions">
                                                    {r.status !== "REJECTED" && (
                                                        <button type="button" className="app-btn app-btn--danger-ghost app-btn--sm" disabled={busy} onClick={() => void decide([r], false)}>{t.reject}</button>
                                                    )}
                                                    {r.status !== "APPROVED" && (
                                                        <button type="button" className="app-btn app-btn--outline app-btn--sm" disabled={busy} onClick={() => void decide([r], true)}>{t.approve}</button>
                                                    )}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <p className="notice"><InfoIcon aria-hidden="true" />{t.approvalsLimitations}</p>

            {opened && (
                <RegistrationDrawer
                    key={opened.id}
                    registration={opened}
                    date={opened.date}
                    today={today}
                    owner={usersById.get(opened.userId) ?? (opened.userId === me.id ? me : undefined)}
                    me={me}
                    admin={admin}
                    projects={projects}
                    onClose={() => setOpened(null)}
                    onChanged={onChanged}
                />
            )}
        </div>
    );
}

export default ApprovalsTab;
