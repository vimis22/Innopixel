import { useState, type FormEvent } from "react";
import type { ChecklistItem, Task } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import { useRunAction } from "../../components/ui/Feedback";
import { CloseIcon } from "../../components/icons/Icons";
import { PlusIcon } from "../../components/icons/AppIcons";
import { createId } from "../../utils/id";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

// Sub-steps of a task. Assignees and project managers can tick, add and remove items.
function TaskChecklist({ task, editable }: { task: Task; editable: boolean }) {
    const text = useAppText();
    const t = text.tasks;
    const { actions } = useWorkspaceData();
    const run = useRunAction();
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const done = task.checklist.filter((item) => item.done).length;

    async function save(checklist: ChecklistItem[]) {
        setSaving(true);
        const ok = await run(() => actions.updateTaskChecklist(task.id, checklist));
        setSaving(false);
        return ok;
    }

    async function add(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft.trim()) return;
        if (await save([...task.checklist, { id: createId("c"), text: draft.trim(), done: false }])) setDraft("");
    }

    return (
        <section className="detail-section" aria-labelledby={`checklist-${task.id}`}>
            <h3 id={`checklist-${task.id}`} className="detail-section-title">
                {task.checklist.length ? t.checklistCount(done, task.checklist.length) : t.checklist}
            </h3>
            {task.checklist.length === 0 && <p className="muted small">{t.checklistEmpty}</p>}
            <ul className="checklist">
                {task.checklist.map((item) => (
                    <li key={item.id} className="checklist-item">
                        <label>
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={item.done}
                                disabled={!editable || saving}
                                onChange={() => void save(task.checklist.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                            />
                            <span className={item.done ? "is-done" : ""}>{item.text}</span>
                        </label>
                        {editable && (
                            <button
                                type="button"
                                className="icon-btn icon-btn--sm"
                                disabled={saving}
                                onClick={() => void save(task.checklist.filter((i) => i.id !== item.id))}
                                aria-label={t.checklistRemove(item.text)}
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {editable && (
                <form className="checklist-add" onSubmit={(e) => void add(e)}>
                    <input
                        className="control"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={t.checklistPlaceholder}
                        aria-label={t.checklistAdd}
                        disabled={saving}
                        maxLength={120}
                    />
                    <button type="submit" className="icon-btn icon-btn--bordered" disabled={saving || !draft.trim()} aria-label={t.checklistAdd}>
                        <PlusIcon />
                    </button>
                </form>
            )}
        </section>
    );
}

export default TaskChecklist;
