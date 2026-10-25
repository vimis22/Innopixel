namespace Innopixel.Tests.Workspace;

using Innopixel.Workspace.Application;
using Innopixel.Workspace.Domain;

public class TimeCalculationsTests
{
    private static DateTime Utc(int y, int m, int d, int h, int min = 0) => new(y, m, d, h, min, 0, DateTimeKind.Utc);

    [Fact]
    public void DanishTime_UsesSummerAndWinterTime()
    {
        // Sommertid: UTC+2. Vintertid: UTC+1.
        Assert.Equal(Utc(2026, 6, 15, 6), TimeCalculations.ToUtc(new DateOnly(2026, 6, 15), new TimeOnly(8, 0)));
        Assert.Equal(Utc(2026, 12, 15, 7), TimeCalculations.ToUtc(new DateOnly(2026, 12, 15), new TimeOnly(8, 0)));

        // 02:30 findes ikke den nat, uret stilles frem.
        Assert.Null(TimeCalculations.ToUtc(new DateOnly(2026, 3, 29), new TimeOnly(2, 30)));

        // 23:30 UTC den 15. juni er allerede den 16. i Danmark.
        Assert.Equal(new DateOnly(2026, 6, 16), TimeCalculations.LocalDate(Utc(2026, 6, 15, 23, 30)));
    }

    [Fact]
    public void ResolveRange_PutsAnEarlierClockOutOnTheNextDay()
    {
        var (start, end) = TimeCalculations.ResolveRange(new DateOnly(2026, 11, 16), new TimeOnly(22, 0), new TimeOnly(6, 0))!.Value;

        Assert.Equal(Utc(2026, 11, 16, 21), start);
        Assert.Equal(Utc(2026, 11, 17, 5), end);
        Assert.Equal(TimeSpan.FromHours(8), end - start);

        // Samme klokkeslæt ind og ud = 24 timer.
        var whole = TimeCalculations.ResolveRange(new DateOnly(2026, 11, 16), new TimeOnly(8, 0), new TimeOnly(8, 0))!.Value;
        Assert.Equal(TimeSpan.FromHours(24), whole.End - whole.Start);
    }

    [Fact]
    public void WorkedTime_ExcludesBreaks_AndCountsALiveRegistrationUntilNow()
    {
        var finished = new WsWorkLog { Checkin = Utc(2026, 11, 16, 7), Checkout = Utc(2026, 11, 16, 15, 30), BreakMinutes = 30 };
        Assert.Equal(8 * 60, TimeCalculations.ToMinutes(TimeCalculations.WorkedSeconds(finished, [], Utc(2026, 11, 20, 0))));

        var active = new WsWorkLog { Checkin = Utc(2026, 11, 16, 7) };
        WsWorkLogBreak[] breaks =
        [
            new() { StartAt = Utc(2026, 11, 16, 9), EndAt = Utc(2026, 11, 16, 9, 15) },
            new() { StartAt = Utc(2026, 11, 16, 10) }   // løber stadig
        ];
        var now = Utc(2026, 11, 16, 10, 20);

        Assert.Equal(35 * 60, TimeCalculations.BreakSeconds(breaks, now));
        Assert.Equal(3 * 60 + 20 - 35, TimeCalculations.ToMinutes(TimeCalculations.WorkedSeconds(active, breaks, now)));
    }

    [Fact]
    public void Weeks_PlannedHours_AndMissingDays_FollowTheDanishWorkWeek()
    {
        Assert.Equal(new DateOnly(2026, 11, 16), TimeCalculations.WeekStart(new DateOnly(2026, 11, 22)));   // søndag -> mandag
        Assert.Equal(new DateOnly(2026, 11, 16), TimeCalculations.WeekStart(new DateOnly(2026, 11, 16)));

        Assert.Equal(444, TimeCalculations.PlannedMinutes(new DateOnly(2026, 11, 16), 37m));   // 37 t / 5 dage = 7 t 24 min
        Assert.Equal(0, TimeCalculations.PlannedMinutes(new DateOnly(2026, 11, 21), 37m));     // lørdag

        var registered = new HashSet<DateOnly> { new(2026, 11, 2), new(2026, 11, 4) };
        // 2.-8. november: man-fre = 5 arbejdsdage, 2 registreret -> 3 mangler; weekenden tæller ikke.
        Assert.Equal(3, TimeCalculations.MissingWorkdays(new DateOnly(2026, 11, 2), new DateOnly(2026, 11, 8), registered));
        Assert.Equal(0, TimeCalculations.MissingWorkdays(new DateOnly(2026, 11, 5), new DateOnly(2026, 11, 4), registered));
    }

    [Theory]
    [InlineData(2, 2000, 0, TeamTimeStatus.Missing)]
    [InlineData(0, 700, 888, TeamTimeStatus.Behind)]
    [InlineData(0, 850, 888, TeamTimeStatus.OnTrack)]
    [InlineData(1, 0, 0, TeamTimeStatus.OnTrack)]
    public void TeamStatus(int missing, int worked, int expectedSoFar, string expected) =>
        Assert.Equal(expected, TimeCalculations.TeamStatus(missing, worked, expectedSoFar));
}
