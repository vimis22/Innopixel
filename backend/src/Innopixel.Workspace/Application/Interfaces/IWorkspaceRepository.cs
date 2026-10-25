namespace Innopixel.Workspace.Application.Interfaces;

using Innopixel.Workspace.Domain;

// Platformens projekter (dem med en projektleder) og alt, der hører til dem.
public sealed record WorkspaceSnapshot(
    List<WsProject> Projects,
    List<WsMember> Members,
    List<WsTask> Tasks,
    List<WsChecklistItem> Checklist,
    List<WsDependency> Dependencies,
    List<WsMilestone> Milestones);

public interface IWorkspaceRepository
{
    Task<WorkspaceSnapshot> GetSnapshotAsync();
    Task<IReadOnlyList<WsStatusHistory>> GetStatusHistoryAsync();
    Task<IReadOnlyList<WsActivity>> GetRecentActivityAsync(int limit);

    // Kører alle ændringer i én transaktion. Fejler noget, gemmes intet.
    Task WriteAsync(Func<IWorkspaceWriter, Task> changes);
    Task<T> WriteAsync<T>(Func<IWorkspaceWriter, Task<T>> changes);
}

// De enkelte ændringer, som en operation består af.
public interface IWorkspaceWriter
{
    Task<int> InsertProjectAsync(WsProject project);
    Task UpdateProjectAsync(WsProject project);
    Task SetProjectArchivedAsync(int projectId, bool archived, DateTime updatedAt);

    Task AddMemberAsync(int projectId, int employeeId, DateTime addedAt);
    Task RemoveMemberAsync(int projectId, int employeeId);

    // Åbne opgaver mister deres ansvarlige, når vedkommende forlader projektet.
    Task UnassignOpenTasksAsync(int projectId, int employeeId);

    Task AddStatusHistoryAsync(int projectId, string? from, string to, int changedBy, DateTime changedAt);

    Task<int> InsertTaskAsync(WsTask task);
    Task UpdateTaskAsync(WsTask task);
    Task DeleteTaskAsync(int taskId);
    Task SetPredecessorsAsync(int taskId, IReadOnlyCollection<int> predecessorIds);
    Task SetChecklistAsync(int taskId, IReadOnlyList<WsChecklistItem> items);
    Task SetTaskMilestoneAsync(int taskId, int? milestoneId);

    Task<int> InsertMilestoneAsync(WsMilestone milestone);
    Task UpdateMilestoneAsync(WsMilestone milestone);
    Task DeleteMilestoneAsync(int milestoneId);

    Task LogAsync(string type, int actorId, int? projectId, int? taskId, string message, DateTime createdAt);
}
