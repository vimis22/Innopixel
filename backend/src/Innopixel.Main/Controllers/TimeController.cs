namespace Innopixel.Main.Controllers;

using Innopixel.Main.Infrastructure;
using Innopixel.Workspace.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Tidsregistrering i Innopixel Studio. Hvem der må se og ændre hvad, afgøres af ITimeRegistrationService
// ud fra den indloggede medarbejder; userId-parametre virker kun for administratorer.
[ApiController]
[Authorize]
[Route("api/time")]
public class TimeController(ITimeRegistrationService time) : ControllerBase
{
    private int ActorId => CurrentUser.Id(User);

    // Kortene og den aktive stempling.
    [HttpGet("overview")]
    public Task<TimeOverviewDto> Overview() => time.GetOverviewAsync(ActorId);

    // Timer pr. dag i ugen, der indeholder datoen weekStart (standard: denne uge).
    [HttpGet("week")]
    public Task<TimeWeekDto> Week([FromQuery] string? weekStart, [FromQuery] string? userId) =>
        time.GetWeekAsync(ActorId, weekStart, userId);

    // Registreringer med dato fra og med from til og med to (højst 93 dage).
    [HttpGet("registrations")]
    public Task<IReadOnlyList<TimeRegistrationDto>> Registrations([FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? userId) =>
        time.GetRegistrationsAsync(ActorId, from, to, userId);

    [HttpPost("clock-in")]
    public async Task<ActionResult<TimeRegistrationDto>> ClockIn(ClockInDto input) =>
        StatusCode(StatusCodes.Status201Created, await time.ClockInAsync(ActorId, input));

    [HttpPost("clock-out")]
    public Task<TimeRegistrationDto> ClockOut() => time.ClockOutAsync(ActorId);

    [HttpPost("breaks/start")]
    public Task<TimeRegistrationDto> StartBreak() => time.StartBreakAsync(ActorId);

    [HttpPost("breaks/end")]
    public Task<TimeRegistrationDto> EndBreak() => time.EndBreakAsync(ActorId);

    [HttpPost("registrations")]
    public async Task<ActionResult<TimeRegistrationDto>> Create(TimeRegistrationInputDto input) =>
        StatusCode(StatusCodes.Status201Created, await time.CreateAsync(ActorId, input));

    [HttpPut("registrations/{registrationId}")]
    public Task<TimeRegistrationDto> Update(string registrationId, TimeRegistrationInputDto input) =>
        time.UpdateAsync(ActorId, registrationId, input);

    [HttpDelete("registrations/{registrationId}")]
    public async Task<IActionResult> Delete(string registrationId)
    {
        await time.DeleteAsync(ActorId, registrationId);
        return NoContent();
    }

    // Kun administratorer.
    [HttpPut("registrations/{registrationId}/approval")]
    public async Task<IActionResult> SetApproval(string registrationId, TimeApprovalDto input)
    {
        await time.SetApprovalAsync(ActorId, registrationId, input.Approved);
        return NoContent();
    }

    // Kun administratorer.
    [HttpGet("team")]
    public Task<TeamTimeDto> Team([FromQuery] string? weekStart) => time.GetTeamAsync(ActorId, weekStart);

    // Kun administratorer.
    [HttpGet("pending")]
    public Task<IReadOnlyList<TimeRegistrationDto>> Pending([FromQuery] string? userId) => time.GetPendingAsync(ActorId, userId);
}
