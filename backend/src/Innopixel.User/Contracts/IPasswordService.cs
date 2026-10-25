namespace Innopixel.User.Contracts;

// What the platform shows an administrator about an employee's login (never the password itself).
public record AccountInfo(StaffMember Staff, bool MustChangePassword, DateTime? LastLoginAt);

// What every request checks against the login cookie: the stamp changes when the password does.
public record StaffSession(int EmployeeId, Guid SecurityStamp, bool Active, bool MustChangePassword);

public enum PasswordTokenPurpose
{
    Reset,
    Invite
}

/*
 * Temporary passwords, reset links and invitations. Passwords are only ever stored as hashes and reset tokens
 * only as SHA-256 hashes; neither is logged or returned. Errors are ServiceErrorException with a message key
 * from the frontend's da.ts (auth.*, team.access.*, settings.password.*).
 */
public interface IPasswordService
{
    bool EmailConfigured { get; }

    Task<AccountInfo> GetAccountAsync(int employeeId);

    Task<StaffSession?> GetSessionAsync(int employeeId);

    // The administrator confirms with their own password. The employee must choose a new one at next login,
    // and their open sessions end.
    Task SetTemporaryPasswordAsync(int adminId, string adminPassword, int employeeId, string temporaryPassword);

    // Sends a reset link to the employee's e-mail (administrators).
    Task SendResetLinkAsync(int adminId, int employeeId);

    // Sends a link to choose a first password (a new account).
    Task SendInvitationAsync(int adminId, int employeeId);

    // "Glemt adgangskode": silently does nothing for unknown, deactivated or throttled addresses,
    // so the response never reveals whether an account exists.
    Task RequestResetAsync(string email);

    // Which kind of link a token is, or a validation error (auth.reset.invalid / expired / used).
    Task<PasswordTokenPurpose> ValidateTokenAsync(string token);

    // Sets the new password, uses up the token (and every other open link of the employee) and ends all sessions.
    Task ResetWithTokenAsync(string token, string newPassword);
}
