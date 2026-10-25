namespace Innopixel.User.Application;

using System.Security.Cryptography;
using System.Text;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

// Lifetimes and limits of password links. PublicBaseUrl is the frontend's address.
public sealed record PasswordLinkSettings(
    string PublicBaseUrl,
    TimeSpan ResetLifetime,
    TimeSpan InviteLifetime,
    int MaxLinksPerWindow,
    TimeSpan Window)
{
    public static PasswordLinkSettings Default(string publicBaseUrl) =>
        new(publicBaseUrl, TimeSpan.FromMinutes(60), TimeSpan.FromHours(72), MaxLinksPerWindow: 3, Window: TimeSpan.FromMinutes(15));
}

public class PasswordService(
    IStaffRepository staffRepository,
    IPasswordTokenRepository tokenRepository,
    IPasswordHasher<StaffMember> passwordHasher,
    IEmailSender emailSender,
    PasswordLinkSettings settings,
    TimeProvider timeProvider,
    ILogger<PasswordService> logger) : IPasswordService
{
    private const int TokenBytes = 32;           // 256 bits from a cryptographic random generator

    public bool EmailConfigured => emailSender.IsConfigured;

    public async Task<AccountInfo> GetAccountAsync(int employeeId)
    {
        var credentials = await staffRepository.GetCredentialsByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();
        return new AccountInfo(credentials.Staff, credentials.MustChangePassword, credentials.LastLoginAt);
    }

    public async Task<StaffSession?> GetSessionAsync(int employeeId) =>
        await staffRepository.GetCredentialsByIdAsync(employeeId) is { } c
            ? new StaffSession(c.Staff.Id, c.SecurityStamp, c.Staff.Active, c.MustChangePassword)
            : null;

    public async Task SetTemporaryPasswordAsync(int adminId, string adminPassword, int employeeId, string temporaryPassword)
    {
        var admin = await staffRepository.GetCredentialsByIdAsync(adminId) ?? throw ServiceErrorException.Forbidden();
        if (!admin.Staff.IsAdmin || !admin.Staff.Active)
        {
            throw ServiceErrorException.Forbidden();
        }

        // Re-authentication: a forgotten session on a shared computer must not be enough to take over an account
        if (admin.PasswordHash is null
            || passwordHasher.VerifyHashedPassword(admin.Staff, admin.PasswordHash, adminPassword ?? string.Empty) == PasswordVerificationResult.Failed)
        {
            throw ServiceErrorException.Validation("team.access.adminPasswordWrong");
        }

        // Your own password is changed under Indstillinger, with your current password
        if (employeeId == adminId)
        {
            throw ServiceErrorException.Validation("team.access.notOwnAccount");
        }

        var employee = await staffRepository.GetByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();
        PasswordPolicy.Validate(temporaryPassword);
        await staffRepository.ReplacePasswordAsync(employee.Id, passwordHasher.HashPassword(employee, temporaryPassword), mustChangePassword: true);
    }

    public Task SendResetLinkAsync(int adminId, int employeeId) => SendLinkAsync(adminId, employeeId, PasswordTokenPurpose.Reset);

    public Task SendInvitationAsync(int adminId, int employeeId) => SendLinkAsync(adminId, employeeId, PasswordTokenPurpose.Invite);

    public async Task RequestResetAsync(string email)
    {
        if (!emailSender.IsConfigured || string.IsNullOrWhiteSpace(email) || email.Length > 254)
        {
            return;
        }

        var credentials = await staffRepository.GetCredentialsByEmailAsync(email.Trim());
        if (credentials is not { Staff.Active: true } || await ThrottledAsync(credentials.Staff.Id))
        {
            return;
        }

        try
        {
            await IssueAndSendAsync(credentials.Staff, PasswordTokenPurpose.Reset, requestedBy: null);
        }
        catch (Exception error)
        {
            // The visitor gets the same neutral answer either way; the operator sees the failure (without the link)
            logger.LogError(error, "Password reset e-mail to employee {EmployeeId} could not be sent.", credentials.Staff.Id);
        }
    }

    public async Task<PasswordTokenPurpose> ValidateTokenAsync(string token)
    {
        var record = await tokenRepository.FindAsync(Hash(token));
        var owner = record is null ? null : await staffRepository.GetByIdAsync(record.EmployeeId);
        if (record is null || owner is not { Active: true })
        {
            throw ServiceErrorException.Validation("auth.reset.invalid");
        }

        if (record.UsedAt is not null)
        {
            throw ServiceErrorException.Validation("auth.reset.used");
        }

        if (record.ExpiresAt <= Now())
        {
            throw ServiceErrorException.Validation("auth.reset.expired");
        }

        return record.Purpose;
    }

    public async Task ResetWithTokenAsync(string token, string newPassword)
    {
        // The token is checked first, so a weak password doesn't reveal anything about an invalid link
        await ValidateTokenAsync(token);
        PasswordPolicy.Validate(newPassword);

        var (outcome, _) = await tokenRepository.RedeemAsync(Hash(token), Now(), () => passwordHasher.HashPassword(null!, newPassword));
        switch (outcome)
        {
            case RedeemOutcome.Used: throw ServiceErrorException.Validation("auth.reset.used");
            case RedeemOutcome.Expired: throw ServiceErrorException.Validation("auth.reset.expired");
            case RedeemOutcome.Invalid: throw ServiceErrorException.Validation("auth.reset.invalid");
        }
    }

    private async Task SendLinkAsync(int adminId, int employeeId, PasswordTokenPurpose purpose)
    {
        var admin = await staffRepository.GetByIdAsync(adminId);
        if (admin is not { IsAdmin: true, Active: true })
        {
            throw ServiceErrorException.Forbidden();
        }

        if (!emailSender.IsConfigured)
        {
            throw ServiceErrorException.Validation("team.access.emailNotConfigured");
        }

        var employee = await staffRepository.GetByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();
        if (!employee.Active)
        {
            throw ServiceErrorException.Validation("team.access.inactive");
        }

        if (await ThrottledAsync(employee.Id))
        {
            throw ServiceErrorException.Validation("team.access.tooManyLinks");
        }

        try
        {
            await IssueAndSendAsync(employee, purpose, adminId);
        }
        catch (Exception error) when (error is not ServiceErrorException)
        {
            logger.LogError(error, "Password e-mail ({Purpose}) to employee {EmployeeId} could not be sent.", purpose, employee.Id);
            throw ServiceErrorException.Validation("team.access.emailFailed");
        }
    }

    private async Task IssueAndSendAsync(StaffMember employee, PasswordTokenPurpose purpose, int? requestedBy)
    {
        var token = Base64Url(RandomNumberGenerator.GetBytes(TokenBytes));
        var now = Now();
        var lifetime = purpose == PasswordTokenPurpose.Invite ? settings.InviteLifetime : settings.ResetLifetime;
        await tokenRepository.CreateAsync(employee.Id, Hash(token), purpose, now, now + lifetime, requestedBy);

        var link = $"{settings.PublicBaseUrl.TrimEnd('/')}/nulstil-adgangskode#token={token}";
        var message = purpose == PasswordTokenPurpose.Invite
            ? PasswordEmails.Invitation(employee.Email, employee.Name, link, (int)lifetime.TotalHours)
            : PasswordEmails.Reset(employee.Email, employee.Name, link, (int)lifetime.TotalMinutes);

        try
        {
            await emailSender.SendAsync(message);
        }
        catch
        {
            // A link that never arrived must not stay usable
            await tokenRepository.InvalidateOpenAsync(employee.Id, Now());
            throw;
        }
    }

    // At most MaxLinksPerWindow links per employee per window, whoever asks (stops mail flooding)
    private async Task<bool> ThrottledAsync(int employeeId) =>
        await tokenRepository.CountSinceAsync(employeeId, Now() - settings.Window) >= settings.MaxLinksPerWindow;

    private DateTime Now() => timeProvider.GetUtcNow().UtcDateTime;

    internal static byte[] Hash(string token) => SHA256.HashData(Encoding.UTF8.GetBytes(token ?? string.Empty));

    private static string Base64Url(byte[] bytes) => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
