import api from "../../services/api";
import type { CreatedUser, Project, Task, WorkspaceData } from "../../types/domain";
import { call } from "./apiErrors";
import type { WorkspaceRepository } from "./repository";

/*
 * WorkspaceRepository backed by the ASP.NET Core Web API (backend/src/Innopixel.Main/Controllers/WorkspaceController.cs).
 * The server identifies the user by the login cookie and enforces every permission rule;
 * failures arrive as RepositoryError with a Danish message from da.ts.
 */

const id = encodeURIComponent;

export const apiRepository: WorkspaceRepository = {
    load: () => call(async () => (await api.get<WorkspaceData>("/workspace")).data),

    createProject: (input) => call(async () => (await api.post<Project>("/workspace/projects", input)).data),
    updateProject: (projectId, input) => call(async () => {
        await api.put(`/workspace/projects/${id(projectId)}`, input);
    }),
    setProjectArchived: (projectId, archived) => call(async () => {
        await api.put(`/workspace/projects/${id(projectId)}/archived`, { archived });
    }),
    addProjectMember: (projectId, userId) => call(async () => {
        await api.post(`/workspace/projects/${id(projectId)}/members`, { userId });
    }),
    removeProjectMember: (projectId, userId) => call(async () => {
        await api.delete(`/workspace/projects/${id(projectId)}/members/${id(userId)}`);
    }),
    setUserProjects: (userId, projectIds) => call(async () => {
        await api.put(`/workspace/users/${id(userId)}/projects`, { projectIds });
    }),

    createTask: (input) => call(async () => (await api.post<Task>("/workspace/tasks", input)).data),
    updateTask: (taskId, input) => call(async () => {
        await api.put(`/workspace/tasks/${id(taskId)}`, input);
    }),
    updateTaskProgress: (taskId, patch) => call(async () => {
        await api.patch(`/workspace/tasks/${id(taskId)}/progress`, patch);
    }),
    updateTaskSchedule: (taskId, patch) => call(async () => {
        await api.patch(`/workspace/tasks/${id(taskId)}/schedule`, patch);
    }),
    updateTaskChecklist: (taskId, checklist) => call(async () => {
        await api.put(`/workspace/tasks/${id(taskId)}/checklist`, checklist);
    }),
    deleteTask: (taskId) => call(async () => {
        await api.delete(`/workspace/tasks/${id(taskId)}`);
    }),

    createMilestone: (input) => call(async () => {
        await api.post("/workspace/milestones", input);
    }),
    updateMilestone: (milestoneId, input) => call(async () => {
        await api.put(`/workspace/milestones/${id(milestoneId)}`, input);
    }),
    setMilestoneCompleted: (milestoneId, completed) => call(async () => {
        await api.put(`/workspace/milestones/${id(milestoneId)}/completed`, { completed });
    }),
    deleteMilestone: (milestoneId) => call(async () => {
        await api.delete(`/workspace/milestones/${id(milestoneId)}`);
    }),

    createUser: (input) => call(async () => (await api.post<CreatedUser>("/workspace/users", input)).data),
    updateUser: (userId, input) => call(async () => {
        await api.put(`/workspace/users/${id(userId)}`, input);
    }),
    setUserActive: (userId, active) => call(async () => {
        await api.put(`/workspace/users/${id(userId)}/active`, { active });
    }),
    updateOwnProfile: (profile) => call(async () => {
        await api.put("/workspace/profile", profile);
    }),
};
