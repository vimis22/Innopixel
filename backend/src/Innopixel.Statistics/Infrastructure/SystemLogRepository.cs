namespace Innopixel.Statistics.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.Statistics.Application.Interfaces;
using Innopixel.Statistics.Domain;

public class SystemLogRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ISystemLogRepository
{
    private const string SelectSystemLogs = "SELECT * FROM systemlog WHERE ";

    public Task<OperationResult> CreateSystemLogAsync(SystemLog systemLogInfo) =>
        ExecuteAsync(
            "INSERT INTO systemlog (description, timezonestamp, changedlocationsystem) VALUES (@Description, @TimezoneStamp, @ChangedLocationSystem)",
            systemLogInfo);

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByIdAsync(int systemLogId) =>
        QueryAsync<SystemLog>(SelectSystemLogs + "id = @SystemLogId", new { SystemLogId = systemLogId });

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByAllInfoAsync(DateTime timestamp, string description, string? changedLocationSystem) =>
        QueryAsync<SystemLog>(
            SelectSystemLogs + "timezonestamp = @Timestamp AND description = @Description AND changedlocationsystem IS NOT DISTINCT FROM @ChangedLocationSystem",
            new { Timestamp = timestamp, Description = description, ChangedLocationSystem = changedLocationSystem });

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByTimestampAsync(DateTime timestamp) =>
        QueryAsync<SystemLog>(SelectSystemLogs + "timezonestamp = @Timestamp", new { Timestamp = timestamp });

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByDescriptionAsync(string description) =>
        QueryAsync<SystemLog>(SelectSystemLogs + "description = @Description", new { Description = description });

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByChangedLocationSystemAsync(string changedLocationSystem) =>
        QueryAsync<SystemLog>(
            SelectSystemLogs + "changedlocationsystem = @ChangedLocationSystem ORDER BY timezonestamp DESC",
            new { ChangedLocationSystem = changedLocationSystem });

    public Task<IReadOnlyList<SystemLog>> GetSystemLogByDateRangeAsync(DateTime fromDate, DateTime toDate) =>
        QueryAsync<SystemLog>(
            SelectSystemLogs + "timezonestamp BETWEEN @FromDate AND @ToDate ORDER BY timezonestamp DESC",
            new { FromDate = fromDate, ToDate = toDate });

    public Task<OperationResult> UpdateSystemLogByFullAsync(SystemLog systemLog, DateTime timestamp, string description, string? changedLocationSystem) =>
        ExecuteAsync(
            "UPDATE systemlog SET timezonestamp = @Timestamp, description = @Description, changedlocationsystem = @ChangedLocationSystem WHERE id = @Id",
            new { systemLog.Id, Timestamp = timestamp, Description = description, ChangedLocationSystem = changedLocationSystem });

    public Task<OperationResult> UpdateSystemLogByTimestampAsync(SystemLog systemLog, DateTime timestamp) =>
        ExecuteAsync("UPDATE systemlog SET timezonestamp = @Timestamp WHERE id = @Id", new { systemLog.Id, Timestamp = timestamp });

    public Task<OperationResult> UpdateSystemLogByDescriptionAsync(SystemLog systemLog, string description) =>
        ExecuteAsync("UPDATE systemlog SET description = @Description WHERE id = @Id", new { systemLog.Id, Description = description });

    public Task<OperationResult> UpdateSystemLogByChangedLocationSystemAsync(SystemLog systemLog, string? changedLocationSystem) =>
        ExecuteAsync(
            "UPDATE systemlog SET changedlocationsystem = @ChangedLocationSystem WHERE id = @Id",
            new { systemLog.Id, ChangedLocationSystem = changedLocationSystem });

    public Task<OperationResult> DeleteSystemLogByAllInfoAsync(SystemLog systemLog) =>
        ExecuteAsync("DELETE FROM systemlog WHERE id = @Id", new { systemLog.Id });

    public Task<OperationResult> DeleteSystemLogsOlderThanAsync(DateTime date) =>
        ExecuteAsync("DELETE FROM systemlog WHERE timezonestamp < @Date", new { Date = date });
}
