namespace Innopixel.User.Application;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Microsoft.AspNetCore.Identity;

public class AuthenticationService(IStaffRepository staffRepository, IPasswordHasher<StaffMember> passwordHasher, TimeProvider timeProvider) : IStaffAuthenticationService
{
    // Bruges, når emailen ikke findes, så svartiden ikke afslører, om en konto eksisterer.
    private static readonly string DummyHash = new PasswordHasher<StaffMember>().HashPassword(null!, "innopixel-dummy-password");

    public async Task<LoginResult> LoginAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
        {
            return new LoginResult(LoginOutcome.InvalidCredentials, null);
        }

        var credentials = await staffRepository.GetCredentialsByEmailAsync(email);
        if (credentials?.PasswordHash is null)
        {
            passwordHasher.VerifyHashedPassword(null!, DummyHash, password);
            return new LoginResult(LoginOutcome.InvalidCredentials, null);
        }

        var verification = passwordHasher.VerifyHashedPassword(credentials.Staff, credentials.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return new LoginResult(LoginOutcome.InvalidCredentials, null);
        }

        // Ældre hash-format: gem en ny hash med de nuværende indstillinger.
        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            await staffRepository.RehashPasswordAsync(credentials.Staff.Id, passwordHasher.HashPassword(credentials.Staff, password));
        }

        if (!credentials.Staff.Active)
        {
            return new LoginResult(LoginOutcome.Inactive, null);
        }

        await staffRepository.RecordLoginAsync(credentials.Staff.Id, timeProvider.GetUtcNow().UtcDateTime);
        return new LoginResult(LoginOutcome.Success, credentials.Staff,
            new StaffSession(credentials.Staff.Id, credentials.SecurityStamp, Active: true, credentials.MustChangePassword));
    }

    public async Task<bool> EnsureInitialPasswordAsync(string email, string password)
    {
        var credentials = await staffRepository.GetCredentialsByEmailAsync(email);
        if (credentials is null || credentials.PasswordHash is not null)
        {
            return false;
        }

        PasswordPolicy.Validate(password);
        // Valgt af den, der driver systemet (user secrets), så der kræves ikke et skift
        await staffRepository.ReplacePasswordAsync(credentials.Staff.Id, passwordHasher.HashPassword(credentials.Staff, password), mustChangePassword: false);
        return true;
    }
}
