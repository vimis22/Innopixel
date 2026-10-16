import { useState, type ReactNode } from "react";
import type { Project } from "../../types/domain";
import type { TimeOverview, TimeRegistration } from "../../types/time";
import { useAppText } from "../../i18n/app/useAppText";
import Panel from "../../components/ui/Panel";
import { Pill } from "../../components/ui/Badges";
import { useFeedback, useRunAction } from "../../components/ui/Feedback";
import { ClockIcon, LogoutIcon, PauseIcon, PlayIcon } from "../../components/icons/AppIcons";
import { addDays, formatDate } from "../../utils/date";
import { danishDate, formatClock, formatDuration, formatHours, liveWorkedSeconds } from "./timeFormat";
import { timeApi } from "./timeApi";

interface LiveClockPanelProps {
    overview: TimeOverview;
    now: number;                 // server-corrected current time (ms)
    todaySeconds: number;        // worked today, including the running registration
    projects: Project[];         // projects the user may register time on
    onChanged: () => void;
    children?: ReactNode;        // the week chart, shown beside the clock
}

// "Min stempling": clock in/out and breaks. The state always comes from the server (overview.active),
// so a refresh, a second tab or another device shows the same running clock.
function LiveClockPanel({ overview, now, todaySeconds, projects, onChanged, children }: LiveClockPanelProps) {
    const text = useAppText();
    const t = text.time;
    const run = useRunAction();
    const { toast } = useFeedback();
    const [busy, setBusy] = useState(false);
    const [projectId, setProjectId] = useState("");
    const active = overview.active;

    // One request at a time; the server rejects duplicates too (e.g. a double click in two tabs)
    async function act(action: () => Promise<TimeRegistration>, success: (result: TimeRegistration) => string) {
        if (busy) return;
        setBusy(true);
        let result: TimeRegistration | null = null;
        const ok = await run(async () => {
            result = await action();
        });
        setBusy(false);
        if (ok && result) {
            toast("success", success(result));
            onChanged();
        }
    }

    const plannedSeconds = overview.todayPlannedMinutes * 60;
    const progress = plannedSeconds > 0 ? Math.min(1, todaySeconds / plannedSeconds) : todaySeconds > 0 ? 1 : 0;
    const shownSeconds = active ? liveWorkedSeconds(active, now) : todaySeconds;

    const status = !active
        ? { tone: "neutral" as const, label: t.statusOut }
        : active.onBreak
            ? { tone: "warning" as const, label: t.statusBreak }
            : { tone: "success" as const, label: t.statusIn };

    return (
        <Panel title={t.clockTitle} action={<Pill tone={status.tone} large><span className="time-status-dot" aria-hidden="true" />{status.label}</Pill>} className="time-clock-panel">
            <div className="time-clock-layout">
                <div className="time-clock">
                    <ClockRing
                        progress={progress}
                        value={formatDuration(shownSeconds)}
                        caption={active ? (active.onBreak ? t.statusBreak : t.activeTime) : t.statToday}
                        label={t.ringLabel(formatHours(Math.floor(todaySeconds / 60)), formatHours(overview.todayPlannedMinutes))}
                        paused={Boolean(active?.onBreak)}
                    />
                    <p className="time-last-event"><LastEvent overview={overview} /></p>

                    {active ? (
                        <div className="time-clock-actions">
                            {active.onBreak ? (
                                <button type="button" className="app-btn app-btn--primary" disabled={busy}
                                    onClick={() => act(timeApi.endBreak, () => t.breakEnded_toast)}>
                                    <PlayIcon aria-hidden="true" /> {t.endBreak}
                                </button>
                            ) : (
                                <button type="button" className="app-btn app-btn--primary" disabled={busy}
                                    onClick={() => act(timeApi.startBreak, () => t.breakStarted_toast)}>
                                    <PauseIcon aria-hidden="true" /> {t.startBreak}
                                </button>
                            )}
                            <button type="button" className="app-btn app-btn--ghost" disabled={busy}
                                onClick={() => act(timeApi.clockOut, (r) => t.clockedOut_toast(formatHours(r.workedMinutes)))}>
                                <LogoutIcon aria-hidden="true" /> {t.clockOut}
                            </button>
                        </div>
                    ) : (
                        <div className="time-clock-actions time-clock-actions--start">
                            {projects.length > 0 && (
                                <select className="control" aria-label={t.projectOptional} value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={busy}>
                                    <option value="">{t.noProject}</option>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}
                            <button type="button" className="app-btn app-btn--primary" disabled={busy}
                                onClick={() => act(() => timeApi.clockIn(projectId || null), () => t.clockedIn_toast)}>
                                <ClockIcon aria-hidden="true" /> {t.clockIn}
                            </button>
                        </div>
                    )}
                    {active?.projectName && <p className="time-clock-project">{t.colProject}: {active.projectName}</p>}
                </div>
                {children}
            </div>
        </Panel>
    );
}

function LastEvent({ overview }: { overview: TimeOverview }) {
    const t = useAppText().time;
    const { active, latest, today } = overview;

    let event: { label: string; at: string } | null = null;
    if (active) {
        const openBreak = active.breaks.find((b) => !b.endAt);
        event = openBreak ? { label: t.eventBreak, at: openBreak.startAt } : { label: t.eventIn, at: active.clockIn };
    } else if (latest?.clockOut) {
        event = { label: t.eventOut, at: latest.clockOut };
    }
    if (!event) return <>{t.noEvents}</>;

    const date = danishDate(event.at);
    const day = date === today ? t.today : date === addDays(today, -1) ? t.yesterday : formatDate(date);
    return (
        <>
            <span>{t.lastEvent}:</span> <strong>{event.label} {t.at(day, formatClock(event.at))}</strong>
        </>
    );
}

// Progress of today's hours against the planned hours, with the live time in the middle
function ClockRing({ progress, value, caption, label, paused }: { progress: number; value: string; caption: string; label: string; paused: boolean }) {
    const radius = 84;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className={`time-ring ${paused ? "is-paused" : ""}`} role="img" aria-label={label}>
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id="time-ring-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff7a1a" />
                        <stop offset="60%" stopColor="#ff4d4d" />
                        <stop offset="100%" stopColor="#ff2d7a" />
                    </linearGradient>
                </defs>
                <circle className="time-ring-track" cx="100" cy="100" r={radius} />
                <circle
                    className="time-ring-value"
                    cx="100" cy="100" r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    transform="rotate(-90 100 100)"
                />
            </svg>
            <span className="time-ring-text" aria-hidden="true">
                <span className="time-ring-value-text">{value}</span>
                <span className="time-ring-caption">{caption}</span>
            </span>
        </div>
    );
}

export default LiveClockPanel;
