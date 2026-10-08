import type { ReactNode } from "react";
import type { ProjectStatus, TaskPriority, TaskStatus } from "../../types/domain";
import type { MilestoneState, ScheduleStatus } from "../../features/workspace/progress";
import { useAppText } from "../../i18n/app/useAppText";
import { AlertIcon, CheckIcon, ClockIcon } from "../icons/AppIcons";

/*
 * Status pills. Color always comes with a text label, so meaning never depends on color alone.
 * The tone mapping lives here, so every page shows the same status the same way.
 */

export type PillTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export function Pill({ tone = "neutral", children, large = false }: { tone?: PillTone; children: ReactNode; large?: boolean }) {
    return <span className={`pill pill--${tone} ${large ? "pill--lg" : ""}`}>{children}</span>;
}

const taskStatusTone: Record<TaskStatus, PillTone> = { TODO: "neutral", IN_PROGRESS: "success", IN_REVIEW: "info", DONE: "success" };
const priorityTone: Record<TaskPriority, PillTone> = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger", CRITICAL: "danger" };
const projectStatusTone: Record<ProjectStatus, PillTone> = { PLANNED: "warning", ACTIVE: "success", ON_HOLD: "neutral", COMPLETED: "info", CANCELLED: "neutral" };

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    const text = useAppText();
    return (
        <Pill tone={taskStatusTone[status]}>
            {status === "DONE" && <CheckIcon aria-hidden="true" />}
            {text.taskStatus[status]}
        </Pill>
    );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
    const text = useAppText();
    return (
        <Pill tone={priorityTone[priority]}>
            {priority === "CRITICAL" && <AlertIcon aria-hidden="true" />}
            {text.priority[priority]}
        </Pill>
    );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
    const text = useAppText();
    return <Pill tone={projectStatusTone[status]}>{text.projectStatus[status]}</Pill>;
}

// One pill for a project: "Forsinket" / "I risiko" override the status while the project is active
export function ProjectStatePill({ status, schedule }: { status: ProjectStatus; schedule: ScheduleStatus }) {
    const text = useAppText();
    if (schedule === "DELAYED") return <Pill tone="danger"><AlertIcon aria-hidden="true" />{text.schedule.DELAYED}</Pill>;
    if (schedule === "AT_RISK") return <Pill tone="warning"><AlertIcon aria-hidden="true" />{text.schedule.AT_RISK}</Pill>;
    return <ProjectStatusBadge status={status} />;
}

const milestoneTone: Record<MilestoneState, PillTone> = { UPCOMING: "warning", OVERDUE: "danger", COMPLETED: "success" };
const milestoneIcon = { UPCOMING: ClockIcon, OVERDUE: AlertIcon, COMPLETED: CheckIcon } satisfies Record<MilestoneState, unknown>;

export function MilestoneBadge({ state }: { state: MilestoneState }) {
    const text = useAppText();
    const Icon = milestoneIcon[state];
    return <Pill tone={milestoneTone[state]}><Icon aria-hidden="true" />{text.milestoneState[state]}</Pill>;
}

export function OverdueBadge() {
    const text = useAppText();
    return <Pill tone="danger"><AlertIcon aria-hidden="true" />{text.common.overdue}</Pill>;
}

// Relative deadline as a pill: "I dag", "Om 4 dage", "Overskredet"
export function DuePill({ days }: { days: number }) {
    const text = useAppText();
    if (days < 0) return <Pill tone="danger">{text.common.overdue}</Pill>;
    if (days === 0) return <Pill tone="danger">{text.dates.today}</Pill>;
    return <Pill tone={days <= 7 ? "warning" : "neutral"}>{text.dates.inDays(days)}</Pill>;
}
