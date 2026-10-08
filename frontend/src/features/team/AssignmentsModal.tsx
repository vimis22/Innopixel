import { useState } from "react";
import type { User } from "../../types/domain";
import { useAppText } from "../../i18n/app/useAppText";
import Modal from "../../components/ui/Modal";
import { useRunAction } from "../../components/ui/Feedback";
import { activeProjects } from "../workspace/selectors";
import { useWorkspaceData } from "../workspace/WorkspaceContext";

// Administrators choose which projects a person works on. Managers stay on their own projects.
function AssignmentsModal({ user, onClose }: { user: User; onClose: () => void }) {
    const text = useAppText();
    const t = text.team;
    const { data, actions } = useWorkspaceData();
    const run = useRunAction();
    const projects = activeProjects(data);
    const isMember = (projectId: string) => data.members.some((m) => m.projectId === projectId && m.userId === user.id);
    const [selected, setSelected] = useState<string[]>(projects.filter((p) => isMember(p.id)).map((p) => p.id));
    const [saving, setSaving] = useState(false);

    async function save() {
        setSaving(true);
        // Memberships of archived projects are not shown here, so keep them unchanged
        const archived = data.projects.filter((p) => p.archived && isMember(p.id)).map((p) => p.id);
        const ok = await run(() => actions.setUserProjects(user.id, [...selected, ...archived]), t.assignmentsSaved);
        setSaving(false);
        if (ok) onClose();
    }

    return (
        <Modal
            open
            title={`${t.assignments}: ${user.name}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="app-btn app-btn--ghost" onClick={onClose} disabled={saving}>{text.common.cancel}</button>
                    <button type="button" className="app-btn app-btn--primary" onClick={() => void save()} disabled={saving}>{saving ? text.common.saving : text.common.save}</button>
                </>
            }
        >
            <div className="checkbox-list" role="group" aria-label={t.assignments}>
                {projects.map((p) => {
                    const isManager = p.managerId === user.id;
                    const checked = isManager || selected.includes(p.id);
                    const openTasks = data.tasks.filter((x) => x.projectId === p.id && x.assigneeId === user.id && x.status !== "DONE").length;
                    return (
                        <label key={p.id} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={checked}
                                disabled={isManager || saving}
                                onChange={() => setSelected((s) => (s.includes(p.id) ? s.filter((id) => id !== p.id) : [...s, p.id]))}
                            />
                            <span>{p.name}</span>
                            <small className="muted">{isManager ? t.managerLocked : openTasks > 0 ? `${t.openTasks}: ${openTasks}` : text.projectStatus[p.status]}</small>
                            {!checked && openTasks > 0 && <small className="text-danger">{t.unassignWarning(openTasks)}</small>}
                        </label>
                    );
                })}
            </div>
        </Modal>
    );
}

export default AssignmentsModal;
