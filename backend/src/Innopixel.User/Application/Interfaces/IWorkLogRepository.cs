namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public interface IWorkLogRepository
{
    Task<OperationResult> CreateWorkLogAsync(WorkLogInfo workLogInfo);

    Task<IReadOnlyList<WorkLog>> GetWorkLogByIdAsync(int workLogId);
    Task<IReadOnlyList<WorkLog>> GetWorkLogByAllInfoAsync(DateTime checkin, DateTime? checkout, DateTime date, string? description);
    Task<IReadOnlyList<WorkLog>> GetWorkLogByCheckinAsync(DateTime checkin);
    Task<IReadOnlyList<WorkLog>> GetWorkLogByCheckoutAsync(DateTime checkout);
    Task<IReadOnlyList<WorkLog>> GetWorkLogByDateAsync(DateTime date);
    Task<IReadOnlyList<WorkLog>> GetWorkLogByDescriptionAsync(string description);

    Task<OperationResult> UpdateWorkLogByFullAsync(WorkLog workLog, DateTime checkin, DateTime? checkout, DateTime date, string? description);
    Task<OperationResult> UpdateWorkLogByCheckinAsync(WorkLog workLog, DateTime checkin);
    Task<OperationResult> UpdateWorkLogByCheckoutAsync(WorkLog workLog, DateTime? checkout);
    Task<OperationResult> UpdateWorkLogByDateAsync(WorkLog workLog, DateTime date);
    Task<OperationResult> UpdateWorkLogByDescriptionAsync(WorkLog workLog, string? description);

    Task<OperationResult> DeleteWorkLogByAllInfoAsync(WorkLog workLog);
}
