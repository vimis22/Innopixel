import { Route, Routes } from "react-router-dom";
import RequireAuth from "../auth/RequireAuth";
import AppShell from "./AppShell";
import NotFoundPage from "./NotFoundPage";
import DashboardPage from "../dashboard/DashboardPage";
import ProjectsPage from "../projects/ProjectsPage";
import ProjectDetailPage from "../projects/detail/ProjectDetailPage";
import MyTasksPage from "../tasks/MyTasksPage";
import GanttPage from "../gantt/GanttPage";
import KanbanPage from "../kanban/KanbanPage";
import MilestonesPage from "../milestones/MilestonesPage";
import TeamPage from "../team/TeamPage";
import SettingsPage from "../settings/SettingsPage";
import "../../styles/app/index.css";

// Routes below /app. Paths are relative; see APP_ROUTES in config/routes.ts.
// The whole module is lazy-loaded from App.tsx, so the public site doesn't download it.
function AppRoutes() {
    return (
        <RequireAuth>
            <Routes>
                <Route element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="tasks" element={<MyTasksPage />} />
                    <Route path="gantt" element={<GanttPage />} />
                    <Route path="board" element={<KanbanPage />} />
                    <Route path="milestones" element={<MilestonesPage />} />
                    <Route path="team" element={<TeamPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </RequireAuth>
    );
}

export default AppRoutes;
