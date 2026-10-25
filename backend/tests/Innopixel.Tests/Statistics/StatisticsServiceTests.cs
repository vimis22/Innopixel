namespace Innopixel.Tests.Statistics;

using Innopixel.Shared.Results;
using Innopixel.Statistics.Application;
using Innopixel.Statistics.Application.Interfaces;
using Innopixel.Statistics.Domain;
using NSubstitute;

public class StatisticsServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 16, 12, 0, 0, TimeSpan.Zero);

    private readonly ISystemLogRepository _repository = Substitute.For<ISystemLogRepository>();
    private readonly StatisticsService _service;

    public StatisticsServiceTests() => _service = new StatisticsService(_repository, new FixedTimeProvider(Now));

    [Fact]
    public async Task Log_UsesServerTime()
    {
        _repository.CreateSystemLogAsync(Arg.Any<SystemLog>()).Returns(OperationResult.Success);

        await _service.LogAsync(" Project published ", "Projects");

        await _repository.Received(1).CreateSystemLogAsync(Arg.Is<SystemLog>(l =>
            l.Description == "Project published" && l.TimezoneStamp == Now.UtcDateTime && l.ChangedLocationSystem == "Projects"));
    }

    [Fact]
    public async Task Log_RejectsEmptyDescription()
    {
        Assert.Equal(OperationResult.InvalidInput, await _service.LogAsync(" "));
        await _repository.DidNotReceiveWithAnyArgs().CreateSystemLogAsync(default!);
    }

    [Fact]
    public async Task Retention_DeletesOlderThanTheGivenDays()
    {
        await _service.DeleteLogsOlderThanAsync(30);

        await _repository.Received(1).DeleteSystemLogsOlderThanAsync(Now.UtcDateTime.AddDays(-30));
        Assert.Equal(OperationResult.InvalidInput, await _service.DeleteLogsOlderThanAsync(0));
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
