namespace Innopixel.User.Infrastructure;

/*
 * Configuration section "Email". Credentials never go into appsettings.json: set them with user secrets
 * (dotnet user-secrets set "Email:Smtp:Password" "...") or environment variables (Email__Smtp__Password).
 * Without Smtp:Host and FromAddress, e-mail is switched off and the platform says so instead of pretending.
 */
public sealed class EmailOptions
{
    // The address of the frontend; links in e-mails point here (e.g. https://studio.innopixel.dk)
    public string PublicBaseUrl { get; set; } = "http://localhost:5173";

    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Innopixel";

    public SmtpOptions Smtp { get; set; } = new();

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Smtp.Host) && !string.IsNullOrWhiteSpace(FromAddress);
}

public sealed class SmtpOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;

    // "StartTls" (port 587, default), "SslOnConnect" (port 465) or "None" (only for a local test server)
    public string Security { get; set; } = "StartTls";

    public string? Username { get; set; }
    public string? Password { get; set; }
}
