namespace Innopixel.Statistics.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.Statistics.Domain;

public interface ISystemLogRepository
{
    Task<OperationResult> CreateSystemLogAsync(SystemLog systemLogInfo);

    Task<IReadOnlyList<SystemLog>> GetSystemLogByIdAsync(int systemLogId);
    Task<IReadOnlyList<SystemLog>> GetSystemLogByAllInfoAsync(DateTime timestamp, string description, string? changedLocationSystem);
    Task<IReadOnlyList<SystemLog>> GetSystemLogByTimestampAsync(DateTime timestamp);
    Task<IReadOnlyList<SystemLog>> GetSystemLogByDescriptionAsync(string description);
    Task<IReadOnlyList<SystemLog>> GetSystemLogByChangedLocationSystemAsync(string changedLocationSystem);
    Task<IReadOnlyList<SystemLog>> GetSystemLogByDateRangeAsync(DateTime fromDate, DateTime toDate);

    Task<OperationResult> UpdateSystemLogByFullAsync(SystemLog systemLog, DateTime timestamp, string description, string? changedLocationSystem);
    Task<OperationResult> UpdateSystemLogByTimestampAsync(SystemLog systemLog, DateTime timestamp);
    Task<OperationResult> UpdateSystemLogByDescriptionAsync(SystemLog systemLog, string description);
    Task<OperationResult> UpdateSystemLogByChangedLocationSystemAsync(SystemLog systemLog, string? changedLocationSystem);

    Task<OperationResult> DeleteSystemLogByAllInfoAsync(SystemLog systemLog);
    Task<OperationResult> DeleteSystemLogsOlderThanAsync(DateTime date);
}
