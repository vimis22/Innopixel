using Innopixel.ChatbotInterpreter;
using Innopixel.ChatbotInterpreter.Infrastructure;
using Innopixel.ChatbotSystem;
using Innopixel.Images;
using Innopixel.Images.Infrastructure;
using Innopixel.Main.Infrastructure;
using Innopixel.Pages;
using Innopixel.Projects;
using Innopixel.Shared;
using Innopixel.Statistics;
using Innopixel.User;
using Innopixel.User.Contracts;
using Innopixel.User.Infrastructure;
using Innopixel.Workspace;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Innopixel")
    ?? throw new InvalidOperationException("Missing connection string 'ConnectionStrings:Innopixel'.");

// Billedmappen findes ud fra appens content root (ikke processens arbejdsmappe) og oprettes ved opstart,
// så den kan serveres fra første upload.
var imageOptions = builder.Configuration.GetSection("Images").Get<ImageStorageOptions>() ?? new ImageStorageOptions();
imageOptions.RootPath = Path.GetFullPath(imageOptions.RootPath, builder.Environment.ContentRootPath);
Directory.CreateDirectory(imageOptions.RootPath);

// E-mail (nulstillingslinks og invitationer): sektionen "Email" – se EmailOptions. SMTP-adgangskoden sættes via
// user secrets eller miljøvariablen Email__Smtp__Password, aldrig i appsettings.json.
var emailOptions = builder.Configuration.GetSection("Email").Get<EmailOptions>() ?? new EmailOptions();

// Claude:ApiKey sættes via user secrets eller miljøvariablen Claude__ApiKey. Uden nøgle kører chatbotten på faste regler.
builder.Services
    .AddInnopixelDatabase(connectionString)
    .AddUserModule(emailOptions)
    .AddProjectsModule()
    .AddPagesModule()
    .AddImagesModule(imageOptions)
    .AddStatisticsModule()
    .AddChatbotInterpreterModule(builder.Configuration.GetSection("Claude").Get<ClaudeOptions>())
    .AddChatbotSystemModule()
    .AddWorkspaceModule();

builder.Services.AddControllers(options => options.Filters.Add<ServiceErrorFilter>());
builder.Services.AddInnopixelRateLimits(builder.Configuration);

// Login-sessionen er en HttpOnly-cookie (kan ikke læses af JavaScript). SameSite=Strict betyder, at andre
// hjemmesider ikke kan sende den med (beskytter mod CSRF). API'et svarer 401/403 i stedet for at omdirigere.
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "innopixel.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        // Hver forespørgsel tjekker sessionen mod databasen: en deaktiveret konto eller en ny adgangskode
        // (ny security stamp) afslutter alle ældre sessioner med det samme.
        options.Events.OnValidatePrincipal = SessionValidation.ValidateAsync;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();

// Frontenden kalder API'et gennem Vites proxy (samme adresse), så CORS kun er nødvendigt for andre klienter.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (!emailOptions.IsConfigured)
{
    app.Logger.LogWarning("E-mail is not configured (Email:Smtp:Host, Email:FromAddress): reset links and invitations can't be sent.");
}

await SetInitialAdminPasswordAsync(app);

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<PasswordChangeRequiredMiddleware>();
app.UseAuthorization();

// Serverer de uploadede billeder. nosniff forhindrer browseren i at tolke en fil som noget andet end et billede.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imageOptions.RootPath),
    RequestPath = imageOptions.PublicBasePath,
    OnPrepareResponse = context => context.Context.Response.Headers.XContentTypeOptions = "nosniff"
});

app.MapControllers();

app.Run();

// Den første administrator (oprettet af database/003_seed_content.sql) har ingen adgangskode.
// Er InitialAdmin:Email og InitialAdmin:Password sat (user secrets), sættes den én gang ved opstart.
static async Task SetInitialAdminPasswordAsync(WebApplication app)
{
    var email = app.Configuration["InitialAdmin:Email"];
    var password = app.Configuration["InitialAdmin:Password"];
    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
    {
        return;
    }

    using var scope = app.Services.CreateScope();
    if (await scope.ServiceProvider.GetRequiredService<IStaffAuthenticationService>().EnsureInitialPasswordAsync(email, password))
    {
        app.Logger.LogInformation("Initial password set for {Email}.", email);
    }
}

// Gør Program tilgængelig for integrationstestene (WebApplicationFactory).
public partial class Program;
