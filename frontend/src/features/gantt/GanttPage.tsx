import { useState } from "react";
import { useAppText } from "../../i18n/app/useAppText";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/States";
import { GanttIcon } from "../../components/icons/AppIcons";
import { useActiveProjects } from "../workspace/hooks";
import ProjectTimeline from "./ProjectTimeline";

// Completed and cancelled projects are hidden by default to keep the chart readable
const shownByDefault = (status: string) => status !== "COMPLETED" && status !== "CANCELLED";

// The timeline is the page: no statistics, details open in a drawer when a project or task is selected
function GanttPage() {
    const text = useAppText();
    const t = text.gantt;
    const projects = useActiveProjects();
    const [selectedIds, setSelectedIds] = useState<string[]>(() => projects.filter((p) => shownByDefault(p.status)).map((p) => p.id));

    return (
        <div className="page">
            <PageHeader title={t.title} lead={t.lead} />

            {projects.length === 0 ? (
                <EmptyState Icon={GanttIcon} title={text.projects.emptyEmployee} />
            ) : (
                <ProjectTimeline
                    projectIds={selectedIds}
                    grouping="project"
                    projectFilter={{ options: projects, selected: selectedIds, onChange: setSelectedIds }}
                />
            )}
        </div>
    );
}

export default GanttPage;
