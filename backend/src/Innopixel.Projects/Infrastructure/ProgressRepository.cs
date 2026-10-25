namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ProgressRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IProgressRepository
{
    private const string SelectProgress = "SELECT * FROM progress WHERE ";

    public Task<OperationResult> CreateProgressAsync(Progress progressInfo) =>
        ExecuteAsync(
            "INSERT INTO progress (name, comment, changedat, changedby, projects_id) VALUES (@Name, @Comment, @ChangedAt, @ChangedBy, @ProjectsId)",
            progressInfo);

    public Task<IReadOnlyList<Progress>> GetProgressByIdAsync(int progressId) =>
        QueryAsync<Progress>(SelectProgress + "id = @ProgressId", new { ProgressId = progressId });

    public Task<IReadOnlyList<Progress>> GetProgressByAllInfoAsync(string name, string? comment, DateTime? changedAt, string? changedBy) =>
        QueryAsync<Progress>(
            SelectProgress + "name = @Name AND comment IS NOT DISTINCT FROM @Comment AND changedat IS NOT DISTINCT FROM @ChangedAt AND changedby IS NOT DISTINCT FROM @ChangedBy",
            new { Name = name, Comment = comment, ChangedAt = changedAt, ChangedBy = changedBy });

    public Task<IReadOnlyList<Progress>> GetProgressByNameAsync(string name) =>
        QueryAsync<Progress>(SelectProgress + "name = @Name", new { Name = name });

    public Task<IReadOnlyList<Progress>> GetProgressByCommentAsync(string comment) =>
        QueryAsync<Progress>(SelectProgress + "comment = @Comment", new { Comment = comment });

    public Task<IReadOnlyList<Progress>> GetProgressByChangedAtAsync(DateTime changedAt) =>
        QueryAsync<Progress>(SelectProgress + "changedat = @ChangedAt", new { ChangedAt = changedAt });

    public Task<IReadOnlyList<Progress>> GetProgressByChangedByAsync(string changedBy) =>
        QueryAsync<Progress>(SelectProgress + "changedby = @ChangedBy", new { ChangedBy = changedBy });

    public Task<IReadOnlyList<Progress>> GetProgressByProjectsIdAsync(int projectsId) =>
        QueryAsync<Progress>(
            "SELECT * FROM progress WHERE projects_id = @ProjectsId ORDER BY changedat DESC NULLS LAST",
            new { ProjectsId = projectsId });

    public Task<OperationResult> UpdateProgressByFullAsync(Progress progress, string name, string? comment, DateTime? changedAt, string? changedBy) =>
        ExecuteAsync(
            "UPDATE progress SET name = @Name, comment = @Comment, changedat = @ChangedAt, changedby = @ChangedBy WHERE id = @Id",
            new { progress.Id, Name = name, Comment = comment, ChangedAt = changedAt, ChangedBy = changedBy });

    public Task<OperationResult> UpdateProgressByNameAsync(Progress progress, string name) =>
        ExecuteAsync("UPDATE progress SET name = @Name WHERE id = @Id", new { progress.Id, Name = name });

    public Task<OperationResult> UpdateProgressByCommentAsync(Progress progress, string? comment) =>
        ExecuteAsync("UPDATE progress SET comment = @Comment WHERE id = @Id", new { progress.Id, Comment = comment });

    public Task<OperationResult> UpdateProgressByChangedAtAsync(Progress progress, DateTime? changedAt) =>
        ExecuteAsync("UPDATE progress SET changedat = @ChangedAt WHERE id = @Id", new { progress.Id, ChangedAt = changedAt });

    public Task<OperationResult> UpdateProgressByChangedByAsync(Progress progress, string? changedBy) =>
        ExecuteAsync("UPDATE progress SET changedby = @ChangedBy WHERE id = @Id", new { progress.Id, ChangedBy = changedBy });

    // Projekter, der peger på denne progress via PROJECTS.PROGRESS_ID, får feltet nulstillet.
    public Task<OperationResult> DeleteProgressByAllInfoAsync(Progress progress) =>
        ExecuteAsync(
            """
            WITH projects_links AS (UPDATE projects SET progress_id = NULL WHERE progress_id = @Id)
            DELETE FROM progress WHERE id = @Id
            """,
            new { progress.Id });
}
