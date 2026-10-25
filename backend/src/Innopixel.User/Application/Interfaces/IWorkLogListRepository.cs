namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen USER <-> WORKLOG.
public interface IWorkLogListRepository
{
    Task<OperationResult> CreateWorkLogListAsync(WorkLogList workLogListInfo);

    Task<IReadOnlyList<WorkLogList>> GetWorkLogListByFullAsync(int userId, int workLogId);
    Task<IReadOnlyList<WorkLogList>> GetWorkLogListByUserIdAsync(int userId);
    Task<IReadOnlyList<WorkLogList>> GetWorkLogListByWorkLogIdAsync(int workLogId);
    Task<IReadOnlyList<WorkLogList>> GetWorkLogListByDateRangeAsync(int userId, DateTime fromDate, DateTime toDate);

    Task<OperationResult> UpdateWorkLogListByUserAsync(int workLogId, int oldUserId, int newUserId);

    Task<OperationResult> DeleteWorkLogListByAllAsync(int userId, int workLogId);
}
