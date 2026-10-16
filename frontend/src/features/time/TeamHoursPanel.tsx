import { useState } from "react";
import type { ISODate } from "../../types/domain";
import type { TeamMemberTime, TeamTimeStatus } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import Modal from "../../components/ui/Modal";
import ActionMenu from "../../components/ui/ActionMenu";
import { Avatar } from "../../components/ui/Avatar";
import { Pill, type PillTone } from "../../components/ui/Badges";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CheckIcon, UsersIcon } from "../../components/icons/AppIcons";
import { formatClock, formatHours, numericDate } from "./timeFormat";
import { timeApi } from "./timeApi";
import { useTimeQuery } from "./useTimeQuery";

const SHOWN = 5;
const statusTone: Record<TeamTimeStatus, PillTone> = { ON_TRACK: "success", BEHIND: "warning", MISSING: "danger" };

// "Teamets løntimer" (administrators only; the server answers 403 to everyone else)
function TeamHoursPanel({ weekStart, refresh, onChanged }: { weekStart: ISODate; refresh: number; onChanged: () => void }) {
    const text = useAppText();
    const t = text.time;
    const { data, failed, retry } = useTimeQuery(() => timeApi.team(weekStart), [weekStart, refresh]);
    const [showAll, setShowAll] = useState(false);
    const [reviewing, setReviewing] = useState<TeamMemberTime | null>(null);

    // Who needs attention first: missing registrations, then behind, then by name
    const order: Record<TeamTimeStatus, number> = { MISSING: 0, BEHIND: 1, ON_TRACK: 2 };
    const members = [...(data?.members ?? [])].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, "da"));
    const shown = showAll ? members : members.slice(0, SHOWN);

    return (
        <Panel
            title={t.teamTitle}
            className="time-team-panel"
            action={members.length > SHOWN && (
                <button type="button" className="link-arrow" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                    {showAll ? t.showFewer : t.seeAll}
                </button>
            )}
        >
            {failed ? (
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
            ) : !data ? (
                <div className="time-table-loading" aria-hidden="true" />
            ) : members.length === 0 ? (
                <EmptyState Icon={UsersIcon} title={t.noTeam} compact />
            ) : (
                <div className="table-wrap">
                    <table className="table time-team-table">
                        <thead>
                            <tr>
                                <th scope="col">{t.colName}</th>
                                <th scope="col">{t.colWeekHours}</th>
                                <th scope="col" className="num">{t.colMissing}</th>
                                <th scope="col">{t.colStatus}</th>
                                <th scope="col" className="col-actions"><span className="sr-only">{text.common.details}</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((m) => (
                                <tr key={m.userId}>
                                    <td>
                                        <span className="cell-main">
                                            <Avatar user={{ id: m.userId, name: m.name }} size="sm" showTitle={false} />
                                            <span className="cell-text">
                                                <span className="cell-title">{m.name}</span>
                                                <span className="cell-sub truncate">{m.title}</span>
                                            </span>
                                        </span>
                                    </td>
                                    <td className="nowrap">
                                        <strong>{formatHours(m.workedMinutes)}</strong>
                                        <span className="muted"> / {formatHours(m.expectedMinutes)}</span>
                                        {m.pendingCount > 0 && <span className="time-team-pending">{t.pendingCount(m.pendingCount)}</span>}
                                    </td>
                                    <td className="num">{m.missingDays}</td>
                                    <td><Pill tone={statusTone[m.status]}>{t.teamStatus[m.status]}</Pill></td>
                                    <td className="col-actions">
                                        <ActionMenu
                                            label={`${text.common.details} ${m.name}`}
                                            actions={m.pendingCount > 0 ? [{ label: t.reviewRegistrations(m.pendingCount), Icon: CheckIcon, onSelect: () => setReviewing(m) }] : []}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {reviewing && <ReviewModal member={reviewing} onClose={() => setReviewing(null)} onChanged={onChanged} />}
        </Panel>
    );
}

// Approve or reject a colleague's finished registrations
function ReviewModal({ member, onClose, onChanged }: { member: TeamMemberTime; onClose: () => void; onChanged: () => void }) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const { toast } = useFeedback();
    const [version, setVersion] = useState(0);
    const [busy, setBusy] = useState(false);
    const { data, failed, retry } = useTimeQuery(() => timeApi.pending(member.userId), [member.userId, version]);

    async function decide(ids: string[], approved: boolean) {
        setBusy(true);
        let done = 0;
        await run(async () => {
            for (const id of ids) {
                await timeApi.setApproval(id, approved);
                done++;
            }
        });
        setBusy(false);
        if (done > 0) {
            toast("success", ids.length > 1 ? t.allApproved_toast(done) : approved ? t.approved_toast : t.rejected_toast);
            setVersion((v) => v + 1);
            onChanged();
        }
    }

    const list = data ?? [];
    return (
        <Modal
            open
            size="lg"
            title={t.reviewTitle(member.name)}
            onClose={onClose}
            closeLabel={t.close}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose}>{t.close}</button>
                    <button type="button" className="app-btn app-btn--primary" disabled={busy || list.length === 0} onClick={() => decide(list.map((r) => r.id), true)}>
                        <CheckIcon aria-hidden="true" /> {t.approveAll}
                    </button>
                </>
            }
        >
            {failed ? (
                <ErrorState title={t.loadFailed} action={<button type="button" className="app-btn app-btn--ghost app-btn--sm" onClick={retry}>{t.retry}</button>} />
            ) : data && list.length === 0 ? (
                <EmptyState Icon={CheckIcon} title={t.noPending} compact />
            ) : (
                <ul className="list time-review-list">
                    {list.map((r) => (
                        <li key={r.id} className="list-row">
                            <div className="time-review-main">
                                <strong>{numericDate(r.date)} · {formatClock(r.clockIn)}–{r.clockOut ? formatClock(r.clockOut) : ""}</strong>
                                <span className="muted">
                                    {t.hoursShort(formatHours(r.workedMinutes))} · {t.colBreak} {t.minutesShort(r.breakMinutes)}
                                    {r.projectName && ` · ${r.projectName}`}
                                </span>
                                {r.remarks && <span className="time-review-remarks">{r.remarks}</span>}
                            </div>
                            <div className="time-review-actions">
                                <button type="button" className="app-btn app-btn--danger-ghost app-btn--sm" disabled={busy} onClick={() => decide([r.id], false)}>{t.reject}</button>
                                <button type="button" className="app-btn app-btn--outline app-btn--sm" disabled={busy} onClick={() => decide([r.id], true)}>{t.approve}</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}

export default TeamHoursPanel;
