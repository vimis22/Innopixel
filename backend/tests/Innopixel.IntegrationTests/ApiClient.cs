namespace Innopixel.IntegrationTests;

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

// Hele backend (Innopixel.Main) i hukommelsen mod testdatabasen. Hver klient har sine egne cookies,
// så to klienter er to forskellige indloggede personer.
public sealed class InnopixelApi : WebApplicationFactory<Program>
{
    public const string AdminEmail = "michael@innopixel.dk";
    public const string AdminPassword = "Test-Admin-Password-123";

    // The password test employees choose at their first login (the temporary one has to be replaced)
    public const string EmployeePassword = "Egen-Adgangskode-2026!";

    private readonly string _connectionString;
    private readonly string _imageRoot;

    // Uret, som backend bruger. Følger den rigtige tid, indtil en test sætter det.
    public TestClock Clock { get; } = new();

    // E-mails, som backend "sender": opsamles her i stedet for at gå til en SMTP-server
    public CapturingEmailSender Emails { get; } = new();

    private readonly int _passwordResetPerMinute;

    // passwordResetPerMinute: the rate limit for "Glemt adgangskode" (high by default, so tests aren't limited)
    public InnopixelApi(DatabaseFixture db, int passwordResetPerMinute = 1000)
    {
        _passwordResetPerMinute = passwordResetPerMinute;
        _connectionString = db.ConnectionString;
        _imageRoot = db.ImageRoot;
    }

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Innopixel", _connectionString);
        builder.UseSetting("InitialAdmin:Email", AdminEmail);
        builder.UseSetting("InitialAdmin:Password", AdminPassword);
        builder.UseSetting("Images:RootPath", _imageRoot);
        builder.UseSetting("Claude:ApiKey", "");
        builder.UseSetting("RateLimits:LoginPerMinute", "1000");
        builder.UseSetting("RateLimits:ContactPerMinute", "1000");
        builder.UseSetting("RateLimits:PasswordResetPerMinute", _passwordResetPerMinute.ToString(System.Globalization.CultureInfo.InvariantCulture));
        builder.UseSetting("Email:PublicBaseUrl", "https://studio.test");
        builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<TimeProvider>(Clock);
            services.AddSingleton<Innopixel.User.Application.Interfaces.IEmailSender>(Emails);
        });
    }

    public ApiClient NewClient() => new(CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true }));
}

public sealed class ApiClient(HttpClient http)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public HttpClient Http { get; } = http;

    public async Task<JsonElement> LoginAsync(string email, string password)
    {
        var response = await Http.PostAsJsonAsync("/api/auth/login", new { email, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>(Json);
    }

    // First login with a temporary password: choose your own, as the platform requires
    public async Task ChooseOwnPasswordAsync(string temporaryPassword)
    {
        var response = await Http.PutAsJsonAsync("/api/auth/password",
            new { currentPassword = temporaryPassword, newPassword = InnopixelApi.EmployeePassword });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    public async Task<JsonElement> GetAsync(string url)
    {
        var response = await Http.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>(Json);
    }

    public Task<HttpResponseMessage> PostAsync(string url, object body) => Http.PostAsJsonAsync(url, body);

    public Task<HttpResponseMessage> PutAsync(string url, object body) => Http.PutAsJsonAsync(url, body);

    public Task<HttpResponseMessage> PatchAsync(string url, object body) => Http.PatchAsJsonAsync(url, body);

    public async Task<JsonElement> ReadAsync(HttpResponseMessage response, HttpStatusCode expected)
    {
        var text = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expected, $"Expected {expected}, got {response.StatusCode}: {text}");
        return text.Length == 0 ? default : JsonDocument.Parse(text).RootElement.Clone();
    }

    public async Task ExpectAsync(HttpResponseMessage response, HttpStatusCode expected) => await ReadAsync(response, expected);

    // Fejlsvar fra platformen: { code, messageKey }.
    public async Task ExpectErrorAsync(HttpResponseMessage response, HttpStatusCode status, string code, string? messageKey = null)
    {
        var body = await ReadAsync(response, status);
        Assert.Equal(code, body.GetProperty("code").GetString());
        if (messageKey is not null)
        {
            Assert.Equal(messageKey, body.GetProperty("messageKey").GetString());
        }
    }
}

// Records e-mails instead of sending them. Only used by the tests; the application sends through SMTP.
public sealed class CapturingEmailSender : Innopixel.User.Application.Interfaces.IEmailSender
{
    private readonly List<Innopixel.User.Application.Interfaces.EmailMessage> _sent = [];

    public bool IsConfigured { get; set; } = true;

    public bool Fail { get; set; }

    public IReadOnlyList<Innopixel.User.Application.Interfaces.EmailMessage> Sent
    {
        get { lock (_sent) return [.. _sent]; }
    }

    public Task SendAsync(Innopixel.User.Application.Interfaces.EmailMessage message, CancellationToken cancellationToken = default)
    {
        if (Fail) throw new InvalidOperationException("SMTP server unavailable (test)");
        lock (_sent) _sent.Add(message);
        return Task.CompletedTask;
    }

    // The reset token from the link in the latest e-mail to the address
    public string LatestToken(string toAddress)
    {
        var message = Sent.Last(m => m.ToAddress == toAddress);
        return System.Text.RegularExpressions.Regex.Match(message.TextBody, "#token=([A-Za-z0-9_-]+)").Groups[1].Value;
    }
}

// Et ur, testene kan stille og lade gå, så tidsregistrering kan testes uden at vente.
public sealed class TestClock : TimeProvider
{
    private DateTimeOffset? _now;

    public override DateTimeOffset GetUtcNow() => _now ?? DateTimeOffset.UtcNow;

    public void Set(DateTimeOffset now) => _now = now;

    public void Advance(TimeSpan duration) => _now = GetUtcNow() + duration;
}
