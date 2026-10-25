namespace Innopixel.Statistics.Application;

using Innopixel.Shared.Results;
using Innopixel.Statistics.Application.Interfaces;
using Innopixel.Statistics.Contracts;
using Innopixel.Statistics.Domain;

public class StatisticsService(ISystemLogRepository systemLogRepository, TimeProvider timeProvider) : IStatisticsService
{
    public const int MaxDescriptionLength = 2000;
    public const int MaxLocationLength = 100;

    public Task<OperationResult> LogAsync(string description, string? changedLocationSystem = null)
    {
        if (string.IsNullOrWhiteSpace(description)
            || description.Length > MaxDescriptionLength
            || changedLocationSystem?.Length > MaxLocationLength)
        {
            return Task.FromResult(OperationResult.InvalidInput);
        }

        return systemLogRepository.CreateSystemLogAsync(new SystemLog
        {
            Description = description.Trim(),
            TimezoneStamp = timeProvider.GetUtcNow().UtcDateTime,
            ChangedLocationSystem = changedLocationSystem
        });
    }

    public Task<IReadOnlyList<SystemLog>> GetLogsAsync(DateTime fromDate, DateTime toDate) =>
        systemLogRepository.GetSystemLogByDateRangeAsync(fromDate, toDate);

    public Task<IReadOnlyList<SystemLog>> GetLogsByLocationAsync(string changedLocationSystem) =>
        systemLogRepository.GetSystemLogByChangedLocationSystemAsync(changedLocationSystem);

    public Task<OperationResult> DeleteLogsOlderThanAsync(int retentionDays) =>
        retentionDays < 1
            ? Task.FromResult(OperationResult.InvalidInput)
            : systemLogRepository.DeleteSystemLogsOlderThanAsync(timeProvider.GetUtcNow().UtcDateTime.AddDays(-retentionDays));
}
