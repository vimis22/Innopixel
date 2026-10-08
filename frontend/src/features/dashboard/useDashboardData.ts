import { useMemo } from "react";
import { APP_ROUTES } from "../../config/routes";
import { useAppText } from "../../i18n/app/useAppText";
import { addDays, startOfWeek, todayISO } from "../../utils/date";
import { isAdmin } from "../auth/permissions";
import { isTaskOverdue } from "../workspace/progress";
import { useActiveProjects, useMyProjects, useMyTasks } from "../workspace/hooks";
import { compareTasksByUrgency, getMilestoneInfo, visibleTasks } from "../workspace/selectors";
import { useCurrentUser, useWorkspaceData } from "../workspace/WorkspaceContext";
import type { DeadlineItem } from "./DeadlineList";

const DEADLINE_HORIZON_DAYS = 14;
const MAX_PROJECTS = 4;
const MAX_TASKS = 5;
const MAX_DEADLINES = 5;

/*
 * Everything the dashboard shows, derived from the shared workspace data.
 * Administrators get an organisation-wide scope for projects and deadlines;
 * employees only see their own projects. "My tasks" is always personal.
 */
export function useDashboardData() {
    const text = useAppText();
    const user = useCurrentUser();
    const { data, summaries } = useWorkspaceData();
    const allActive = useActiveProjects();
    const myProjects = useMyProjects();
    const myTasks = useMyTasks();
    const admin = isAdmin(user);

    return useMemo(() => {
        const today = todayISO();
        const horizon = addDays(today, DEADLINE_HORIZON_DAYS);
        const weekEnd = addDays(startOfWeek(today), 6);

        const scopeProjects = admin ? allActive : myProjects;
        const running = scopeProjects.filter((p) => p.status === "ACTIVE" || p.status === "PLANNED" || p.status === "ON_HOLD");
        const scopeIds = new Set(scopeProjects.map((p) => p.id));
        const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? "";

        const openMyTasks = myTasks.filter((t) => t.status !== "DONE").sort(compareTasksByUrgency);

        // Deadlines: open tasks (all in scope for admins, own for employees) plus unfinished milestones
        const deadlineTasks = (admin ? visibleTasks(data) : myTasks)
            .filter((t) => scopeIds.has(t.projectId) && t.status !== "DONE" && t.dueDate <= horizon)
            .map<DeadlineItem>((t) => ({
                key: t.id,
                date: t.dueDate,
                title: t.title,
                subtitle: projectName(t.projectId),
                to: `${APP_ROUTES.project(t.projectId)}?tab=tasks&task=${t.id}`,
            }));
        const openMilestones = data.milestones.filter((m) => scopeIds.has(m.projectId) && getMilestoneInfo(data, m).state !== "COMPLETED");
        const deadlineMilestones = openMilestones
            .filter((m) => m.dueDate <= horizon)
            .map<DeadlineItem>((m) => ({
                key: m.id,
                date: m.dueDate,
                title: `${text.dashboard.milestonePrefix}${m.title}`,
                subtitle: projectName(m.projectId),
                to: `${APP_ROUTES.project(m.projectId)}?tab=milestones`,
            }));
        const deadlines = [...deadlineTasks, ...deadlineMilestones].sort((a, b) => a.date.localeCompare(b.date));

        // Progress ring: own tasks for employees, all tasks in active projects for administrators
        const ringTasks = admin ? visibleTasks(data) : myTasks;

        return {
            admin,
            stats: {
                activeProjects: scopeProjects.filter((p) => p.status === "ACTIVE").length,
                delayedProjects: scopeProjects.filter((p) => summaries.get(p.id)?.schedule === "DELAYED").length,
                openTasks: openMyTasks.length,
                overdueTasks: openMyTasks.filter((t) => isTaskOverdue(t, today)).length,
                upcomingDeadlines: deadlines.filter((d) => d.date >= today).length,
                milestonesThisWeek: openMilestones.filter((m) => m.dueDate >= today && m.dueDate <= weekEnd).length,
            },
            projects: running
                .sort((a, b) => (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1) || a.endDate.localeCompare(b.endDate))
                .slice(0, MAX_PROJECTS),
            tasks: openMyTasks.slice(0, MAX_TASKS),
            deadlines: deadlines.slice(0, MAX_DEADLINES),
            ringTasks,
            activity: data.activity.slice(0, 6),
        };
    }, [admin, allActive, myProjects, myTasks, data, summaries, text]);
}
