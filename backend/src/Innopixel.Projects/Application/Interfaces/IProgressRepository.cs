namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface IProgressRepository
{
    Task<OperationResult> CreateProgressAsync(Progress progressInfo);

    Task<IReadOnlyList<Progress>> GetProgressByIdAsync(int progressId);
    Task<IReadOnlyList<Progress>> GetProgressByAllInfoAsync(string name, string? comment, DateTime? changedAt, string? changedBy);
    Task<IReadOnlyList<Progress>> GetProgressByNameAsync(string name);
    Task<IReadOnlyList<Progress>> GetProgressByCommentAsync(string comment);
    Task<IReadOnlyList<Progress>> GetProgressByChangedAtAsync(DateTime changedAt);
    Task<IReadOnlyList<Progress>> GetProgressByChangedByAsync(string changedBy);
    Task<IReadOnlyList<Progress>> GetProgressByProjectsIdAsync(int projectsId);

    Task<OperationResult> UpdateProgressByFullAsync(Progress progress, string name, string? comment, DateTime? changedAt, string? changedBy);
    Task<OperationResult> UpdateProgressByNameAsync(Progress progress, string name);
    Task<OperationResult> UpdateProgressByCommentAsync(Progress progress, string? comment);
    Task<OperationResult> UpdateProgressByChangedAtAsync(Progress progress, DateTime? changedAt);
    Task<OperationResult> UpdateProgressByChangedByAsync(Progress progress, string? changedBy);

    Task<OperationResult> DeleteProgressByAllInfoAsync(Progress progress);
}
