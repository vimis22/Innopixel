namespace Innopixel.Main.Infrastructure;

using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

public static class RateLimits
{
    public const string Login = "login";
    public const string ContactForm = "contact";
    public const string PasswordReset = "password-reset";

    // Begrænser forsøg pr. IP-adresse: gætteri på adgangskoder og spam via kontaktformularen.
    // "Glemt adgangskode" og nulstillingslinks begrænses også, så de ikke kan bruges til at sende mange e-mails
    // eller gætte links. Grænserne kan ændres i konfigurationen (RateLimits:LoginPerMinute,
    // RateLimits:ContactPerMinute, RateLimits:PasswordResetPerMinute).
    public static IServiceCollection AddInnopixelRateLimits(this IServiceCollection services, IConfiguration configuration)
    {
        var loginPerMinute = configuration.GetValue("RateLimits:LoginPerMinute", 10);
        var contactPerMinute = configuration.GetValue("RateLimits:ContactPerMinute", 5);
        var passwordResetPerMinute = configuration.GetValue("RateLimits:PasswordResetPerMinute", 5);

        return services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Login, context => PerIp(context, loginPerMinute));
            options.AddPolicy(ContactForm, context => PerIp(context, contactPerMinute));
            options.AddPolicy(PasswordReset, context => PerIp(context, passwordResetPerMinute));
        });
    }

    private static RateLimitPartition<string> PerIp(HttpContext context, int permitPerMinute) =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = permitPerMinute, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });
}
