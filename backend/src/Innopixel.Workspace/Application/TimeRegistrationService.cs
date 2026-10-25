namespace Innopixel.Workspace.Application;

using System.Globalization;
using Innopixel.Shared.Results;
using Innopixel.User.Contracts;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Contracts;
using Innopixel.Workspace.Domain;
using static Innopixel.Workspace.Application.TimeCalculations;
using static Innopixel.Workspace.Application.WorkspaceIds;

// Regler for tidsregistrering:
// - Alle registrerer deres egen tid. Kun administratorer ser andres tid, teamoversigten og godkender.
// - Én aktiv registrering ad gangen, og registreringer må ikke overlappe (låst pr. medarbejder i transaktionen).
// - Arbejdstid = udstempling - indstempling - pauser, aldrig negativ og højst 24 timer.
// - Retter en medarbejder sin egen registrering, skal den godkendes igen. Godkendte registreringer kan kun
//   ændres af en administrator.
public class TimeRegistrationService(
    ITimeRegistrationRepository repository,
    IStaffService staffService,
    TimeProvider timeProvider) : ITimeRegistrationService
{
    public const int MaxRemarksLength = 2000;
    public const int MaxRangeDays = 93;

    // ---------------------------------------------------------------- Read

    public async Task<TimeOverviewDto> GetOverviewAsync(int actorId)
    {
        var actor = await ActorAsync(actorId);
        var now = Now();
        var today = LocalDate(now);
        var weekStart = WeekStart(today);
        var monthStart = MonthStart(today);
        var from = weekStart < monthStart ? weekStart : monthStart;

        var logs = await repository.GetByDateRangeAsync(actor.Id, from, today);
        var breaks = await BreaksByLogAsync(logs);
        var active = logs.FirstOrDefault(l => l.IsActive) ?? await repository.GetActiveAsync(actor.Id);
        if (active is not null && !breaks.ContainsKey(active.Id))
        {
            breaks[active.Id] = [.. await repository.GetBreaksAsync([active.Id])];
        }

        int Minutes(IEnumerable<WsWorkLog> selection) =>
            ToMinutes(selection.Sum(l => WorkedSeconds(l, BreaksOf(breaks, l.Id), now)));

        var registeredDays = logs.Select(l => DateOnly.FromDateTime(l.Date)).ToHashSet();
        var createdOn = LocalDate(actor.CreatedAt);
        var missingFrom = monthStart > createdOn ? monthStart : createdOn;

        var pending = await repository.GetPendingAsync(actor.IsAdmin ? null : actor.Id);
        var latest = active ?? await repository.GetLatestAsync(actor.Id);

        return new TimeOverviewDto(
            now,
            FormatDay(today),
            actor.ExpectedWeeklyHours,
            Minutes(logs.Where(l => DateOnly.FromDateTime(l.Date) == today)),
            PlannedMinutes(today, actor.ExpectedWeeklyHours),
            Minutes(logs.Where(l => DateOnly.FromDateTime(l.Date) >= weekStart)),
            (int)Math.Round(actor.ExpectedWeeklyHours * 60),
            MissingWorkdays(missingFrom, today.AddDays(-1), registeredDays),
            ToMinutes(pending.Sum(l => WorkedSeconds(l, [], now))),
            pending.Select(l => l.UserId).Distinct().Count(),
            active is null ? null : ToDto(active, BreaksOf(breaks, active.Id), now),
            latest is null ? null : ToDto(latest, latest.IsActive ? BreaksOf(breaks, latest.Id) : [], now));
    }

    public async Task<TimeWeekDto> GetWeekAsync(int actorId, string? weekStart, string? userId)
    {
        var actor = await ActorAsync(actorId);
        var target = await TargetUserAsync(actor, userId);
        var now = Now();
        var start = WeekStart(ParseDayOrToday(weekStart, now));
        var end = start.AddDays(6);

        var logs = await repository.GetByDateRangeAsync(target.Id, start, end);
        var breaks = await BreaksByLogAsync(logs);

        var days = Enumerable.Range(0, 7)
            .Select(offset => start.AddDays(offset))
            .Select(day => new TimeDayDto(
                FormatDay(day),
                ToMinutes(logs.Where(l => DateOnly.FromDateTime(l.Date) == day).Sum(l => WorkedSeconds(l, BreaksOf(breaks, l.Id), now))),
                PlannedMinutes(day, target.ExpectedWeeklyHours)))
            .ToList();

        return new TimeWeekDto(FormatDay(start), FormatDay(end), days);
    }

    public async Task<IReadOnlyList<TimeRegistrationDto>> GetRegistrationsAsync(int actorId, string? from, string? to, string? userId)
    {
        var actor = await ActorAsync(actorId);
        var target = await TargetUserAsync(actor, userId);
        if (!TryParseDay(from, out var fromDay) || !TryParseDay(to, out var toDay) || toDay < fromDay || toDay.DayNumber - fromDay.DayNumber > MaxRangeDays)
        {
            throw ServiceErrorException.Validation("time.validation.rangeInvalid");
        }

        var now = Now();
        var logs = await repository.GetByDateRangeAsync(target.Id, fromDay, toDay);
        var breaks = await BreaksByLogAsync(logs);
        return logs.Select(l => ToDto(l, BreaksOf(breaks, l.Id), now)).ToList();
    }

    public async Task<TeamTimeDto> GetTeamAsync(int actorId, string? weekStart)
    {
        var actor = await ActorAsync(actorId);
        if (!actor.IsAdmin)
        {
            throw ServiceErrorException.Forbidden();
        }

        var now = Now();
        var today = LocalDate(now);
        var start = WeekStart(ParseDayOrToday(weekStart, now));
        var end = start.AddDays(6);
        var lastCompletedDay = end < today.AddDays(-1) ? end : today.AddDays(-1);

        var staff = (await staffService.GetAllAsync()).Where(s => s.Active).ToList();
        var logs = await repository.GetByDateRangeAsync(null, start, end);
        var breaks = await BreaksByLogAsync(logs);
        var pending = await repository.GetPendingAsync(null);

        var members = staff
            .Select(member =>
            {
                var own = logs.Where(l => l.UserId == member.Id).ToList();
                var createdOn = LocalDate(member.CreatedAt);
                var countFrom = start > createdOn ? start : createdOn;
                var missing = MissingWorkdays(countFrom, lastCompletedDay, own.Select(l => DateOnly.FromDateTime(l.Date)).ToHashSet());
                var worked = ToMinutes(own.Sum(l => WorkedSeconds(l, BreaksOf(breaks, l.Id), now)));
                var expectedSoFar = Workdays(countFrom, lastCompletedDay) * PlannedMinutes(start, member.ExpectedWeeklyHours);
                var memberPending = pending.Where(l => l.UserId == member.Id).ToList();

                return new TeamMemberTimeDto(
                    Format(member.Id), member.Name, member.Title, worked, (int)Math.Round(member.ExpectedWeeklyHours * 60), missing,
                    memberPending.Count, ToMinutes(memberPending.Sum(l => WorkedSeconds(l, [], now))),
                    TeamStatus(missing, worked, expectedSoFar));
            })
            .ToList();

        return new TeamTimeDto(FormatDay(start), FormatDay(end), members);
    }

    // Afsluttede registreringer, der venter på godkendelse (alle datoer). Kun administratorer.
    public async Task<IReadOnlyList<TimeRegistrationDto>> GetPendingAsync(int actorId, string? userId)
    {
        var actor = await ActorAsync(actorId);
        if (!actor.IsAdmin)
        {
            throw ServiceErrorException.Forbidden();
        }

        int? target = null;
        if (!string.IsNullOrEmpty(userId))
        {
            target = TryParse(userId, out var id) ? id : throw ServiceErrorException.NotFound();
        }

        var now = Now();
        var logs = await repository.GetPendingAsync(target);
        var breaks = await BreaksByLogAsync(logs);
        return logs.Select(l => ToDto(l, BreaksOf(breaks, l.Id), now)).ToList();
    }

    // ---------------------------------------------------------------- Live clock

    public async Task<TimeRegistrationDto> ClockInAsync(int actorId, ClockInDto input)
    {
        var actor = await ActorAsync(actorId);
        var project = await ProjectAsync(input.ProjectId, actor);
        var remarks = ValidateRemarks(input.Remarks);
        var now = Now();

        var log = new WsWorkLog
        {
            UserId = actor.Id,
            Date = LocalDate(now).ToDateTime(TimeOnly.MinValue),
            Checkin = now,
            ProjectsId = project?.Id,
            ProjectName = project?.Name,
            Description = remarks,
            Status = TimeStatus.Pending
        };

        await repository.WriteAsync(actor.Id, async w =>
        {
            // Én aktiv registrering ad gangen, og man kan ikke stemple ind i en periode, der allerede er registreret.
            if (await w.GetActiveAsync(actor.Id) is not null)
            {
                throw ServiceErrorException.Validation("time.validation.alreadyClockedIn");
            }

            if (await w.HasOverlapAsync(actor.Id, now, now.AddSeconds(1), null))
            {
                throw ServiceErrorException.Validation("time.validation.overlap");
            }

            log.Id = await w.InsertAsync(log);
            return true;
        });

        return ToDto(log, [], now);
    }

    public async Task<TimeRegistrationDto> ClockOutAsync(int actorId)
    {
        var actor = await ActorAsync(actorId);
        var now = Now();

        var (log, breaks) = await repository.WriteAsync(actor.Id, async w =>
        {
            var active = await w.GetActiveAsync(actor.Id) ?? throw ServiceErrorException.Validation("time.validation.notClockedIn");

            // En registrering må højst vare 24 timer: har man glemt at stemple ud, rettes den under "Juster løntimer".
            if (now - active.Checkin > TimeSpan.FromHours(24))
            {
                throw ServiceErrorException.Validation("time.validation.tooLong");
            }

            await w.EndOpenBreakAsync(active.Id, now);
            var breakList = await w.GetBreaksAsync(active.Id);

            active.Checkout = now;
            active.BreakMinutes = Math.Min(ToMinutes(BreakSeconds(breakList, now)), (int)Math.Floor((now - active.Checkin).TotalMinutes));
            await w.UpdateAsync(active);
            return (active, breakList);
        });

        return ToDto(log, breaks, now);
    }

    public Task<TimeRegistrationDto> StartBreakAsync(int actorId) => ToggleBreakAsync(actorId, start: true);

    public Task<TimeRegistrationDto> EndBreakAsync(int actorId) => ToggleBreakAsync(actorId, start: false);

    private async Task<TimeRegistrationDto> ToggleBreakAsync(int actorId, bool start)
    {
        var actor = await ActorAsync(actorId);
        var now = Now();

        var (log, breaks) = await repository.WriteAsync(actor.Id, async w =>
        {
            var active = await w.GetActiveAsync(actor.Id) ?? throw ServiceErrorException.Validation("time.validation.notClockedIn");
            var onBreak = (await w.GetBreaksAsync(active.Id)).Any(b => b.EndAt is null);

            if (start)
            {
                if (onBreak)
                {
                    throw ServiceErrorException.Validation("time.validation.alreadyOnBreak");
                }

                await w.StartBreakAsync(active.Id, now);
            }
            else
            {
                if (!onBreak)
                {
                    throw ServiceErrorException.Validation("time.validation.notOnBreak");
                }

                await w.EndOpenBreakAsync(active.Id, now);
            }

            return (active, await w.GetBreaksAsync(active.Id));
        });

        return ToDto(log, breaks, now);
    }

    // ---------------------------------------------------------------- Manual registrations ("Juster løntimer")

    public async Task<TimeRegistrationDto> CreateAsync(int actorId, TimeRegistrationInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var owner = await TargetUserAsync(actor, input.UserId);
        var values = await ValidateInputAsync(input, actor);
        var now = Now();

        var log = new WsWorkLog
        {
            UserId = owner.Id,
            Date = values.Date.ToDateTime(TimeOnly.MinValue),
            Checkin = values.Start,
            Checkout = values.End,
            BreakMinutes = values.BreakMinutes,
            ProjectsId = values.ProjectId,
            ProjectName = values.ProjectName,
            Description = values.Remarks,
            Status = TimeStatus.Pending
        };

        await repository.WriteAsync(owner.Id, async w =>
        {
            if (await w.HasOverlapAsync(owner.Id, values.Start, values.End, null))
            {
                throw ServiceErrorException.Validation("time.validation.overlap");
            }

            log.Id = await w.InsertAsync(log);
            return true;
        });

        return ToDto(log, [], now);
    }

    public async Task<TimeRegistrationDto> UpdateAsync(int actorId, string registrationId, TimeRegistrationInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var log = await EditableAsync(actor, registrationId);
        var values = await ValidateInputAsync(input, actor);
        var now = Now();

        var breaks = await repository.WriteAsync(log.UserId, async w =>
        {
            if (await w.HasOverlapAsync(log.UserId, values.Start, values.End, log.Id))
            {
                throw ServiceErrorException.Validation("time.validation.overlap");
            }

            // Rettes en aktiv registrering, bliver den afsluttet med den angivne udstempling.
            await w.EndOpenBreakAsync(log.Id, values.End);

            log.Date = values.Date.ToDateTime(TimeOnly.MinValue);
            log.Checkin = values.Start;
            log.Checkout = values.End;
            log.BreakMinutes = values.BreakMinutes;
            log.ProjectsId = values.ProjectId;
            log.ProjectName = values.ProjectName;
            log.Description = values.Remarks;

            // Medarbejderens egne rettelser skal godkendes igen; en administrators rettelse ændrer ikke status.
            if (!actor.IsAdmin)
            {
                log.Status = TimeStatus.Pending;
                log.ApprovedBy = null;
                log.ApprovedAt = null;
            }

            await w.UpdateAsync(log);
            return await w.GetBreaksAsync(log.Id);
        });

        return ToDto(log, breaks, now);
    }

    public async Task DeleteAsync(int actorId, string registrationId)
    {
        var actor = await ActorAsync(actorId);
        var log = await EditableAsync(actor, registrationId);
        await repository.WriteAsync(log.UserId, async w =>
        {
            await w.DeleteAsync(log.Id);
            return true;
        });
    }

    public async Task SetApprovalAsync(int actorId, string registrationId, bool approved)
    {
        var actor = await ActorAsync(actorId);
        if (!actor.IsAdmin)
        {
            throw ServiceErrorException.Forbidden();
        }

        var log = TryParse(registrationId, out var id) && await repository.GetByIdAsync(id) is { } found
            ? found
            : throw ServiceErrorException.NotFound();

        if (log.IsActive)
        {
            throw ServiceErrorException.Validation("time.validation.cannotApproveActive");
        }

        log.Status = approved ? TimeStatus.Approved : TimeStatus.Rejected;
        log.ApprovedBy = actor.Id;
        log.ApprovedAt = Now();
        await repository.WriteAsync(log.UserId, async w =>
        {
            await w.UpdateAsync(log);
            return true;
        });
    }

    // ---------------------------------------------------------------- Helpers

    private DateTime Now() => timeProvider.GetUtcNow().UtcDateTime;

    private async Task<StaffMember> ActorAsync(int actorId) =>
        await staffService.GetByIdAsync(actorId) is { Active: true } actor ? actor : throw ServiceErrorException.Forbidden();

    // Den medarbejder, der spørges om. Andre end en selv kræver administratorrettigheder.
    private async Task<StaffMember> TargetUserAsync(StaffMember actor, string? userId)
    {
        if (string.IsNullOrEmpty(userId) || userId == Format(actor.Id))
        {
            return actor;
        }

        if (!actor.IsAdmin)
        {
            throw ServiceErrorException.Forbidden();
        }

        return TryParse(userId, out var id) && await staffService.GetByIdAsync(id) is { } user
            ? user
            : throw ServiceErrorException.NotFound();
    }

    // Ejeren må rette sin egen, så længe den ikke er godkendt; administratorer må rette alle.
    private async Task<WsWorkLog> EditableAsync(StaffMember actor, string registrationId)
    {
        var log = TryParse(registrationId, out var id) && await repository.GetByIdAsync(id) is { } found
            ? found
            : throw ServiceErrorException.NotFound();

        if (log.UserId != actor.Id && !actor.IsAdmin)
        {
            // Samme svar som "findes ikke", så man ikke kan afprøve andres registreringer.
            throw ServiceErrorException.NotFound();
        }

        if (log.Status == TimeStatus.Approved && !actor.IsAdmin)
        {
            throw ServiceErrorException.Validation("time.validation.approvedLocked");
        }

        return log;
    }

    private async Task<(int Id, string Name)?> ProjectAsync(string? projectId, StaffMember actor)
    {
        if (string.IsNullOrEmpty(projectId))
        {
            return null;
        }

        return TryParse(projectId, out var id) && await repository.GetSelectableProjectNameAsync(id, actor.Id, actor.IsAdmin) is { } name
            ? (id, name)
            : throw ServiceErrorException.Validation("time.validation.projectInvalid");
    }

    private static string? ValidateRemarks(string? remarks)
    {
        var trimmed = string.IsNullOrWhiteSpace(remarks) ? null : remarks.Trim();
        return trimmed?.Length > MaxRemarksLength ? throw ServiceErrorException.Validation("time.validation.remarksTooLong") : trimmed;
    }

    private sealed record InputValues(
        DateOnly Date, DateTime Start, DateTime End, int BreakMinutes, int? ProjectId, string? ProjectName, string? Remarks);

    private async Task<InputValues> ValidateInputAsync(TimeRegistrationInputDto input, StaffMember actor)
    {
        if (!TryParseDay(input.Date, out var date))
        {
            throw ServiceErrorException.Validation("time.validation.dateRequired");
        }

        if (!TryParseTime(input.ClockIn, out var clockIn) || !TryParseTime(input.ClockOut, out var clockOut))
        {
            throw ServiceErrorException.Validation("time.validation.timeInvalid");
        }

        var range = ResolveRange(date, clockIn, clockOut) ?? throw ServiceErrorException.Validation("time.validation.timeInvalid");
        var spanMinutes = (range.End - range.Start).TotalMinutes;

        if (input.BreakMinutes < 0 || input.BreakMinutes >= spanMinutes)
        {
            throw ServiceErrorException.Validation("time.validation.breakInvalid");
        }

        // Tid kan ikke registreres frem i tiden (lidt slør for ure, der går forskelligt).
        if (range.End > Now().AddMinutes(5))
        {
            throw ServiceErrorException.Validation("time.validation.futureNotAllowed");
        }

        var project = await ProjectAsync(input.ProjectId, actor);
        return new InputValues(date, range.Start, range.End, input.BreakMinutes, project?.Id, project?.Name, ValidateRemarks(input.Remarks));
    }

    private async Task<Dictionary<int, List<WsWorkLogBreak>>> BreaksByLogAsync(IReadOnlyList<WsWorkLog> logs)
    {
        var activeIds = logs.Where(l => l.IsActive).Select(l => l.Id).ToList();
        var breaks = await repository.GetBreaksAsync(activeIds);
        return breaks.GroupBy(b => b.WorklogId).ToDictionary(g => g.Key, g => g.ToList());
    }

    private static IReadOnlyList<WsWorkLogBreak> BreaksOf(Dictionary<int, List<WsWorkLogBreak>> breaks, int worklogId) =>
        breaks.TryGetValue(worklogId, out var list) ? list : [];

    private static DateOnly ParseDayOrToday(string? value, DateTime now) =>
        string.IsNullOrEmpty(value) ? LocalDate(now)
        : TryParseDay(value, out var day) ? day
        : throw ServiceErrorException.Validation("time.validation.dateRequired");

    private static bool TryParseDay(string? value, out DateOnly day) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out day);

    private static bool TryParseTime(string? value, out TimeOnly time) =>
        TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);

    private static string FormatDay(DateOnly day) => day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    internal static TimeRegistrationDto ToDto(WsWorkLog log, IReadOnlyList<WsWorkLogBreak> breaks, DateTime now)
    {
        var breakMinutes = log.IsActive ? ToMinutes(BreakSeconds(breaks, now)) : log.BreakMinutes;
        return new TimeRegistrationDto(
            Format(log.Id),
            Format(log.UserId),
            FormatDay(DateOnly.FromDateTime(log.Date)),
            Utc(log.Checkin),
            log.Checkout is { } checkout ? Utc(checkout) : null,
            breakMinutes,
            ToMinutes(WorkedSeconds(log, breaks, now)),
            Format(log.ProjectsId),
            log.ProjectName,
            log.Description,
            log.IsActive ? TimeStatus.Active : log.Status,
            log.IsActive && breaks.Any(b => b.EndAt is null),
            breaks.Select(b => new TimeBreakDto(Format(b.Id), Utc(b.StartAt), b.EndAt is { } end ? Utc(end) : null)).ToList());
    }

    private static DateTime Utc(DateTime value) => value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
