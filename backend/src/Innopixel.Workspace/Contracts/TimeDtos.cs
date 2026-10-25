namespace Innopixel.Workspace.Contracts;

// Tidsregistrering. Tidspunkter er UTC (ISO 8601); frontenden viser dem i dansk tid.
// Datoer er "yyyy-MM-dd" (dansk kalenderdato), varigheder er hele minutter.

public record TimeBreakDto(string Id, DateTime StartAt, DateTime? EndAt);

// Status: ACTIVE (stemplet ind), PENDING (afventer godkendelse), APPROVED eller REJECTED.
public record TimeRegistrationDto(
    string Id,
    string UserId,
    string Date,
    DateTime ClockIn,
    DateTime? ClockOut,
    int BreakMinutes,
    int WorkedMinutes,
    string? ProjectId,
    string? ProjectName,
    string? Remarks,
    string Status,
    bool OnBreak,
    IReadOnlyList<TimeBreakDto> Breaks);

// Tallene til de fire kort og "Min stempling".
public record TimeOverviewDto(
    DateTime ServerTime,
    string Today,
    decimal ExpectedWeeklyHours,
    int TodayMinutes,
    int TodayPlannedMinutes,
    int WeekMinutes,
    int WeekPlannedMinutes,
    int MissingDaysThisMonth,
    int PendingMinutes,
    int PendingEmployees,
    TimeRegistrationDto? Active,
    TimeRegistrationDto? Latest);

public record TimeDayDto(string Date, int WorkedMinutes, int PlannedMinutes);

public record TimeWeekDto(string WeekStart, string WeekEnd, IReadOnlyList<TimeDayDto> Days);

// Status: ON_TRACK, BEHIND (mangler timer) eller MISSING (manglende registreringer).
public record TeamMemberTimeDto(
    string UserId,
    string Name,
    string Title,
    int WorkedMinutes,
    int ExpectedMinutes,
    int MissingDays,
    int PendingCount,
    int PendingMinutes,
    string Status);

public record TeamTimeDto(string WeekStart, string WeekEnd, IReadOnlyList<TeamMemberTimeDto> Members);

// --- Input ---

public record ClockInDto(string? ProjectId, string? Remarks);

// Manuel registrering eller rettelse. Klokkeslæt er "HH:mm" i dansk tid; er udstemplingen før indstemplingen,
// er den næste dag. UserId kan kun angives af administratorer (ellers den indloggede).
public record TimeRegistrationInputDto(
    string? Date,
    string? ClockIn,
    string? ClockOut,
    int BreakMinutes,
    string? ProjectId,
    string? Remarks,
    string? UserId = null);

public record TimeApprovalDto(bool Approved);
