import { useCallback, useState } from "react";
import type { ISODate, Project, User } from "../../types/domain";
import type { TimeRegistration } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Drawer from "../../components/ui/Drawer";
import { UserChip } from "../../components/ui/Avatar";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { CheckIcon, TrashIcon } from "../../components/icons/AppIcons";
import { formatLongDate } from "../../utils/date";
import RegistrationForm from "./RegistrationForm";
import { TimeStatusPill } from "./TimeStatusPill";
import { formatClock, numericDate } from "./timeFormat";
import { timeApi } from "./timeApi";

interface RegistrationDrawerProps {
    registration: TimeRegistration | null;   // null: a new registration
    date: ISODate;
    today: ISODate;
    owner: User | undefined;     // whose time it is
    me: User;
    admin: boolean;
    projects: Project[];
    onClose: () => void;
    onChanged: () => void;
}

// One recorded working period: the actual clock-in/out, breaks and status, with correction and approval
function RegistrationDrawer({ registration, date, today, owner, me, admin, projects, onClose, onChanged }: RegistrationDrawerProps) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const { confirm } = useFeedback();
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);
    const forColleague = owner && owner.id !== me.id ? owner.id : undefined;
    const canDelete = registration && (admin || registration.status !== "APPROVED");
    const canDecide = admin && registration && registration.status !== "ACTIVE";

    async function requestClose() {
        if (dirty && !(await confirm({ title: text.team.unsavedTitle, message: text.team.unsavedMessage, confirmLabel: text.team.discard, danger: true }))) return;
        onClose();
    }

    async function remove() {
        if (!registration) return;
        const yes = await confirm({ title: t.deleteTitle, message: t.deleteMessage(numericDate(registration.date)), confirmLabel: text.common.delete, danger: true });
        if (!yes) return;
        setBusy(true);
        const ok = await run(() => timeApi.remove(registration.id), t.deleted_toast);
        setBusy(false);
        if (ok) {
            onChanged();
            onClose();
        }
    }

    async function decide(approved: boolean) {
        if (!registration) return;
        if (!approved) {
            const yes = await confirm({ title: t.rejectTitle, message: t.rejectMessage(owner?.name ?? "", numericDate(registration.date)), confirmLabel: t.reject, danger: true });
            if (!yes) return;
        }
        setBusy(true);
        const ok = await run(() => timeApi.setApproval(registration.id, approved), approved ? t.approved_toast : t.rejected_toast);
        setBusy(false);
        if (ok) {
            onChanged();
            onClose();
        }
    }

    return (
        <Drawer
            open
            title={registration ? t.registrationTitle(numericDate(registration.date)) : t.newRegistrationTitle}
            subtitle={
                <>
                    <UserChip user={owner} fallback="" />
                    {registration && <TimeStatusPill status={registration.status} />}
                </>
            }
            onClose={() => void requestClose()}
            closeLabel={t.close}
            footer={(canDelete || canDecide) && (
                <>
                    {canDelete && (
                        <button type="button" className="app-btn app-btn--danger-ghost app-btn--left" onClick={() => void remove()} disabled={busy}>
                            <TrashIcon aria-hidden="true" /> {text.common.delete}
                        </button>
                    )}
                    {canDecide && registration.status !== "REJECTED" && (
                        <button type="button" className="app-btn app-btn--danger-ghost" onClick={() => void decide(false)} disabled={busy}>{t.reject}</button>
                    )}
                    {canDecide && registration.status !== "APPROVED" && (
                        <button type="button" className="app-btn app-btn--primary" onClick={() => void decide(true)} disabled={busy}>
                            <CheckIcon aria-hidden="true" /> {t.approve}
                        </button>
                    )}
                </>
            )}
        >
            {registration && (
                <dl className="detail-facts">
                    <div><dt>{t.dateLabel}</dt><dd>{formatLongDate(registration.date)}</dd></div>
                    <div><dt>{t.colIn}</dt><dd>{formatClock(registration.clockIn)}</dd></div>
                    <div><dt>{t.colOut}</dt><dd>{registration.clockOut ? formatClock(registration.clockOut) : t.status.ACTIVE}</dd></div>
                    {registration.breaks.length > 0 && (
                        <div>
                            <dt>{t.breaksLabel}</dt>
                            <dd className="time-breaks">
                                {registration.breaks.map((b) => (
                                    <span key={b.id}>{formatClock(b.startAt)}–{b.endAt ? formatClock(b.endAt) : "…"}</span>
                                ))}
                            </dd>
                        </div>
                    )}
                </dl>
            )}

            <section className="detail-section">
                <h3 className="detail-section-title">{registration ? (admin ? t.correctTitle : t.requestCorrection) : t.newRegistrationTitle}</h3>
                <RegistrationForm
                    registration={registration}
                    initialDate={date}
                    today={today}
                    userId={forColleague}
                    admin={admin}
                    projects={projects}
                    onDirtyChange={onDirtyChange}
                    onCancel={() => void requestClose()}
                    onSaved={() => {
                        onChanged();
                        onClose();
                    }}
                />
            </section>
        </Drawer>
    );
}

export default RegistrationDrawer;
