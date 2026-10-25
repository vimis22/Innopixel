namespace Innopixel.Workspace.Contracts;

// Innopixel Studio (den interne platform). Svarer til WorkspaceRepository i frontend/src/features/workspace/repository.ts.
// actorId er den indloggede medarbejder (fra login-cookien), aldrig en værdi fra klienten.
// Regler for adgang og validering håndhæves her; fejl kastes som ServiceErrorException.
public interface IWorkspaceService
{
    Task<WorkspaceDataDto> LoadAsync(int actorId);

    Task<ProjectDto> CreateProjectAsync(int actorId, ProjectInputDto input);
    Task UpdateProjectAsync(int actorId, string projectId, ProjectInputDto input);
    Task SetProjectArchivedAsync(int actorId, string projectId, bool archived);
    Task AddProjectMemberAsync(int actorId, string projectId, string userId);
    Task RemoveProjectMemberAsync(int actorId, string projectId, string userId);
    Task SetUserProjectsAsync(int actorId, string userId, IReadOnlyList<string> projectIds);

    Task<TaskDto> CreateTaskAsync(int actorId, TaskInputDto input);
    Task UpdateTaskAsync(int actorId, string taskId, TaskInputDto input);
    Task UpdateTaskProgressAsync(int actorId, string taskId, TaskProgressPatchDto patch);
    Task UpdateTaskScheduleAsync(int actorId, string taskId, TaskSchedulePatchDto patch);
    Task UpdateTaskChecklistAsync(int actorId, string taskId, IReadOnlyList<ChecklistItemInputDto> checklist);
    Task DeleteTaskAsync(int actorId, string taskId);

    Task CreateMilestoneAsync(int actorId, MilestoneInputDto input);
    Task UpdateMilestoneAsync(int actorId, string milestoneId, MilestoneInputDto input);
    Task SetMilestoneCompletedAsync(int actorId, string milestoneId, bool completed);
    Task DeleteMilestoneAsync(int actorId, string milestoneId);

    Task<CreatedUserDto> CreateUserAsync(int actorId, UserInputDto input);
    Task UpdateUserAsync(int actorId, string userId, UserInputDto input);
    Task SetUserActiveAsync(int actorId, string userId, bool active);
    Task<UserAccountDto> GetUserAccountAsync(int actorId, string userId);
    Task SetTemporaryPasswordAsync(int actorId, string userId, TemporaryPasswordInputDto input);
    Task SendPasswordResetAsync(int actorId, string userId);
    Task<EmailStatusDto> GetEmailStatusAsync(int actorId);
    Task UpdateOwnProfileAsync(int actorId, ProfileInputDto profile);
}
