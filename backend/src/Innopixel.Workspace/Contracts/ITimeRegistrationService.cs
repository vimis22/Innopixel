namespace Innopixel.Workspace.Contracts;

// Tidsregistrering i Innopixel Studio. actorId er den indloggede medarbejder (fra login-cookien).
// Medarbejdere ser og ændrer kun deres egne registreringer; administratorer ser teamet og godkender.
// Fejl kastes som ServiceErrorException med en nøgle fra frontendens tekster (time.validation.*).
public interface ITimeRegistrationService
{
    Task<TimeOverviewDto> GetOverviewAsync(int actorId);

    // weekStart: en dato i ugen ("yyyy-MM-dd"); null = denne uge. userId kun for administratorer.
    Task<TimeWeekDto> GetWeekAsync(int actorId, string? weekStart, string? userId);

    Task<IReadOnlyList<TimeRegistrationDto>> GetRegistrationsAsync(int actorId, string? from, string? to, string? userId);

    Task<TimeRegistrationDto> ClockInAsync(int actorId, ClockInDto input);
    Task<TimeRegistrationDto> ClockOutAsync(int actorId);
    Task<TimeRegistrationDto> StartBreakAsync(int actorId);
    Task<TimeRegistrationDto> EndBreakAsync(int actorId);

    Task<TimeRegistrationDto> CreateAsync(int actorId, TimeRegistrationInputDto input);
    Task<TimeRegistrationDto> UpdateAsync(int actorId, string registrationId, TimeRegistrationInputDto input);
    Task DeleteAsync(int actorId, string registrationId);

    Task SetApprovalAsync(int actorId, string registrationId, bool approved);

    Task<TeamTimeDto> GetTeamAsync(int actorId, string? weekStart);

    Task<IReadOnlyList<TimeRegistrationDto>> GetPendingAsync(int actorId, string? userId);
}
