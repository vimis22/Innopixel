import type { Task } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Donut from "../../components/ui/Donut";

/*
 * Share of finished tasks, with the three states as a ring. "I gang" includes tasks in review.
 * Counts are always written in the legend, so the chart never relies on color alone.
 */
function TaskStatusDonut({ tasks }: { tasks: Task[] }) {
    const text = useAppText();
    const t = text.dashboard;
    const done = tasks.filter((x) => x.status === "DONE").length;
    const inProgress = tasks.filter((x) => x.status === "IN_PROGRESS" || x.status === "IN_REVIEW").length;
    const notStarted = tasks.length - done - inProgress;
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : null;

    const segments = [
        { key: "done", value: done, color: "var(--status-done)", label: t.legendDone },
        { key: "progress", value: inProgress, color: "var(--status-progress)", label: t.legendInProgress },
        { key: "todo", value: notStarted, color: "var(--status-todo)", label: t.legendNotStarted },
    ];

    return (
        <div className="donut-panel">
            <Donut
                segments={segments}
                label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}
                center={
                    <>
                        <span className="donut-value">{percent === null ? "–" : `${percent} %`}</span>
                        <span className="donut-label">{t.donutDone}</span>
                    </>
                }
            />
            <ul className="legend">
                {segments.map((s) => (
                    <li key={s.key}>
                        <span className="dot" style={{ background: s.color }} aria-hidden="true" />
                        <span className="legend-value">{s.value}</span>
                        <span className="legend-label">{s.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TaskStatusDonut;
