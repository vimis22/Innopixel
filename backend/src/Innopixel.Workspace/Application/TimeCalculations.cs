namespace Innopixel.Workspace.Application;

using Innopixel.Workspace.Domain;

// Alle beregninger for tidsregistrering, så tallene er de samme overalt (kort, graf, tabel, team).
// Tidspunkter gemmes i UTC; datoer og klokkeslæt, som brugeren ser og indtaster, er dansk tid.
internal static class TimeCalculations
{
    public static readonly TimeZoneInfo Danish = TimeZoneInfo.FindSystemTimeZoneById("Europe/Copenhagen");

    public static DateOnly LocalDate(DateTime utc) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(AsUtc(utc), Danish));

    // Dansk dato + klokkeslæt -> UTC. Null, hvis klokkeslættet ikke findes (når uret stilles frem om foråret).
    public static DateTime? ToUtc(DateOnly date, TimeOnly time)
    {
        var local = date.ToDateTime(time, DateTimeKind.Unspecified);
        return Danish.IsInvalidTime(local) ? null : TimeZoneInfo.ConvertTimeToUtc(local, Danish);
    }

    // Ind- og udstempling på en dato. Ligger udstemplingen før (eller på) indstemplingen, er den næste dag
    // (en vagt over midnat). Null, hvis et af klokkeslættene ikke findes.
    public static (DateTime Start, DateTime End)? ResolveRange(DateOnly date, TimeOnly clockIn, TimeOnly clockOut)
    {
        var endDate = clockOut <= clockIn ? date.AddDays(1) : date;
        return ToUtc(date, clockIn) is { } start && ToUtc(endDate, clockOut) is { } end ? (start, end) : null;
    }

    // Pausetid i sekunder; en løbende pause tæller med frem til now.
    public static double BreakSeconds(IEnumerable<WsWorkLogBreak> breaks, DateTime now) =>
        breaks.Sum(b => Math.Max(0, ((b.EndAt ?? now) - b.StartAt).TotalSeconds));

    // Arbejdstid uden pauser. For en aktiv registrering: frem til now, minus pauserne indtil nu.
    public static double WorkedSeconds(WsWorkLog log, IEnumerable<WsWorkLogBreak> breaks, DateTime now)
    {
        if (log.Checkout is { } checkout)
        {
            return Math.Max(0, (checkout - log.Checkin).TotalSeconds - log.BreakMinutes * 60);
        }

        return Math.Max(0, (now - log.Checkin).TotalSeconds - BreakSeconds(breaks, now));
    }

    public static int ToMinutes(double seconds) => (int)Math.Round(seconds / 60, MidpointRounding.AwayFromZero);

    public static DateOnly WeekStart(DateOnly date) => date.AddDays(-(((int)date.DayOfWeek + 6) % 7));

    public static DateOnly MonthStart(DateOnly date) => new(date.Year, date.Month, 1);

    public static bool IsWorkday(DateOnly date) => date.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday);

    // Planlagte minutter: ugens timer fordelt ligeligt på mandag-fredag.
    public static int PlannedMinutes(DateOnly date, decimal weeklyHours) =>
        IsWorkday(date) ? (int)Math.Round(weeklyHours * 60 / 5, MidpointRounding.AwayFromZero) : 0;

    // Arbejdsdage fra og med from til og med to, hvor der ikke er nogen registrering.
    public static int MissingWorkdays(DateOnly from, DateOnly to, IReadOnlySet<DateOnly> registered)
    {
        var missing = 0;
        for (var day = from; day <= to; day = day.AddDays(1))
        {
            if (IsWorkday(day) && !registered.Contains(day))
            {
                missing++;
            }
        }

        return missing;
    }

    public static int Workdays(DateOnly from, DateOnly to)
    {
        var count = 0;
        for (var day = from; day <= to; day = day.AddDays(1))
        {
            if (IsWorkday(day))
            {
                count++;
            }
        }

        return count;
    }

    // Ugens status for en medarbejder: mange manglende dage -> MISSING; under 90 % af de planlagte timer for de
    // dage, der er gået -> BEHIND; ellers ON_TRACK.
    public static string TeamStatus(int missingDays, int workedMinutes, int expectedSoFarMinutes) =>
        missingDays >= 2 ? TeamTimeStatus.Missing
        : expectedSoFarMinutes > 0 && workedMinutes < expectedSoFarMinutes * 0.9 ? TeamTimeStatus.Behind
        : TeamTimeStatus.OnTrack;

    private static DateTime AsUtc(DateTime value) =>
        value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
