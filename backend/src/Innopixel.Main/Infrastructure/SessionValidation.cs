namespace Innopixel.Main.Infrastructure;

using System.Globalization;
using System.Security.Claims;
using Innopixel.User.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

/*
 * The login cookie holds the employee id and their security stamp. Every request compares the stamp with the
 * database: a password change, a reset link or a temporary password gives the employee a new stamp, so every
 * older cookie stops working at once. Deactivated accounts are signed out the same way.
 */
public static class SessionValidation
{
    public const string StampClaim = "innopixel:stamp";
    private const string MustChangeKey = "innopixel:mustChangePassword";

    public static ClaimsPrincipal Principal(StaffSession session) => new(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, session.EmployeeId.ToString(CultureInfo.InvariantCulture)),
            new Claim(StampClaim, session.SecurityStamp.ToString())
        ],
        CookieAuthenticationDefaults.AuthenticationScheme));

    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var principal = context.Principal;
        var valid = int.TryParse(principal?.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.None, CultureInfo.InvariantCulture, out var id)
            && Guid.TryParse(principal?.FindFirstValue(StampClaim), out var stamp)
            && await context.HttpContext.RequestServices.GetRequiredService<IPasswordService>().GetSessionAsync(id) is { Active: true } session
            && session.SecurityStamp == stamp
            && Remember(context.HttpContext, session);

        if (!valid)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }

    // True when the signed-in employee still has to replace a temporary password
    public static bool MustChangePassword(HttpContext context) => context.Items[MustChangeKey] is true;

    private static bool Remember(HttpContext context, StaffSession session)
    {
        context.Items[MustChangeKey] = session.MustChangePassword;
        return true;
    }
}

// While a temporary password is in use, only login, logout and choosing a new password are allowed.
// The frontend shows "Vælg ny adgangskode"; this makes sure the rule holds for any client.
public sealed class PasswordChangeRequiredMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path;
        if (SessionValidation.MustChangePassword(context) && (path.StartsWithSegments("/api/workspace") || path.StartsWithSegments("/api/time")))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new { code = "PASSWORD_CHANGE_REQUIRED", messageKey = "auth.mustChange.required" });
            return;
        }

        await next(context);
    }
}
