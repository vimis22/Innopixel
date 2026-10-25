namespace Innopixel.Main.Controllers;

using System.Globalization;
using Innopixel.Main.Infrastructure;
using Innopixel.Statistics.Contracts;
using Innopixel.User.Contracts;
using Innopixel.Workspace.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

// Login til Innopixel Studio (US-12). Sessionen er en HttpOnly-cookie, som JavaScript ikke kan læse.
// Adgangskoder og nulstillingslinks skrives aldrig i logs eller svar.
[ApiController]
[Route("api/auth")]
public class AuthController(
    IStaffAuthenticationService authentication,
    IStaffService staff,
    IPasswordService passwords,
    IStatisticsService audit) : ControllerBase
{
    private const string AuditLocation = "auth";

    public record LoginRequest(string? Email, string? Password);

    public record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);

    public record ForgotPasswordRequest(string? Email);

    public record ResetTokenRequest(string? Token);

    public record ResetPasswordRequest(string? Token, string? NewPassword);

    public record ResetTokenInfo(string Purpose);

    // Den indloggede medarbejder; MustChangePassword: en midlertidig adgangskode skal skiftes, før platformen kan bruges
    public record SessionUserDto(
        string Id, string Name, string Email, string Role, string Title, string? Department, string? Phone,
        bool Active, DateTime CreatedAt, decimal ExpectedWeeklyHours, bool MustChangePassword);

    // 200: brugeren. 401: { code: "INVALID_CREDENTIALS" | "INACTIVE" }. 429: for mange forsøg.
    [HttpPost("login")]
    [EnableRateLimiting(RateLimits.Login)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authentication.LoginAsync(request.Email ?? string.Empty, request.Password ?? string.Empty);
        if (result.Outcome != LoginOutcome.Success || result.Staff is null || result.Session is null)
        {
            return Unauthorized(new { code = result.Outcome == LoginOutcome.Inactive ? "INACTIVE" : "INVALID_CREDENTIALS" });
        }

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, SessionValidation.Principal(result.Session));
        return Ok(ToSessionUser(result.Staff, result.Session.MustChangePassword));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    // Den indloggede medarbejder. 401, hvis man ikke er logget ind eller er blevet deaktiveret.
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var id = CurrentUser.Id(User);
        var user = await staff.GetByIdAsync(id);
        if (user is not { Active: true })
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Unauthorized();
        }

        return Ok(ToSessionUser(user, SessionValidation.MustChangePassword(HttpContext)));
    }

    // Kræver den nuværende adgangskode. Alle andre sessioner afsluttes; denne fortsætter med en ny cookie.
    [HttpPut("password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var id = CurrentUser.Id(User);
        var stamp = await staff.ChangePasswordAsync(id, request.CurrentPassword ?? string.Empty, request.NewPassword ?? string.Empty);
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
            SessionValidation.Principal(new StaffSession(id, stamp, Active: true, MustChangePassword: false)));
        await audit.LogAsync($"Medarbejder {id.ToString(CultureInfo.InvariantCulture)} skiftede sin adgangskode.", AuditLocation);

        var user = await staff.GetByIdAsync(id);
        return user is null ? NoContent() : Ok(ToSessionUser(user, mustChangePassword: false));
    }

    // "Glemt adgangskode". Svarer altid 202, så svaret ikke afslører, om e-mailen har en konto.
    [HttpPost("password/forgot")]
    [EnableRateLimiting(RateLimits.PasswordReset)]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await passwords.RequestResetAsync(request.Email ?? string.Empty);
        return Accepted();
    }

    // Tjekker et link, før formularen vises. 400 { messageKey: auth.reset.invalid | expired | used }.
    [HttpPost("password/reset/validate")]
    [EnableRateLimiting(RateLimits.PasswordReset)]
    public async Task<ResetTokenInfo> ValidateResetToken(ResetTokenRequest request)
    {
        var purpose = await passwords.ValidateTokenAsync(request.Token ?? string.Empty);
        return new ResetTokenInfo(purpose == PasswordTokenPurpose.Invite ? "INVITE" : "RESET");
    }

    // Vælger en ny adgangskode med et link. Linket bruges op, og alle sessioner afsluttes; man logger ind igen.
    [HttpPost("password/reset")]
    [EnableRateLimiting(RateLimits.PasswordReset)]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        await passwords.ResetWithTokenAsync(request.Token ?? string.Empty, request.NewPassword ?? string.Empty);
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        await audit.LogAsync("En adgangskode blev nulstillet med et link.", AuditLocation);
        return NoContent();
    }

    private static SessionUserDto ToSessionUser(StaffMember member, bool mustChangePassword)
    {
        var u = UserDtoMapper.ToDto(member);
        return new SessionUserDto(u.Id, u.Name, u.Email, u.Role, u.Title, u.Department, u.Phone, u.Active, u.CreatedAt, u.ExpectedWeeklyHours, mustChangePassword);
    }
}
