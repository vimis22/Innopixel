namespace Innopixel.Statistics.Contracts;

using Innopixel.Shared.Results;
using Innopixel.Statistics.Domain;

// Systemloggen. Besøgsstatistik (US-20) håndteres af et eksternt analyseværktøj og gemmes ikke her.
public interface IStatisticsService
{
    // Tidspunktet sættes af serveren.
    Task<OperationResult> LogAsync(string description, string? changedLocationSystem = null);

    Task<IReadOnlyList<SystemLog>> GetLogsAsync(DateTime fromDate, DateTime toDate);
    Task<IReadOnlyList<SystemLog>> GetLogsByLocationAsync(string changedLocationSystem);

    // Oprydning: sletter logs ældre end retentionDays dage.
    Task<OperationResult> DeleteLogsOlderThanAsync(int retentionDays);
}
