namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts;

// A reset or invitation link as stored: only the SHA-256 hash of the token.
public record PasswordTokenRecord(int EmployeeId, PasswordTokenPurpose Purpose, DateTime ExpiresAt, DateTime? UsedAt);

public enum RedeemOutcome
{
    Success,
    Invalid,
    Expired,
    Used
}

public interface IPasswordTokenRepository
{
    Task CreateAsync(int employeeId, byte[] tokenHash, PasswordTokenPurpose purpose, DateTime createdAt, DateTime expiresAt, int? requestedBy);

    // Links created for the employee since `since` (throttling of repeated requests)
    Task<int> CountSinceAsync(int employeeId, DateTime since);

    Task<PasswordTokenRecord?> FindAsync(byte[] tokenHash);

    // Marks every open link of the employee as used (e.g. one that could not be e-mailed)
    Task InvalidateOpenAsync(int employeeId, DateTime at);

    // In one transaction: checks the link, sets the new password hash, gives the employee a new security stamp
    // (ending all sessions) and uses up every open link of the employee. A link can only be redeemed once,
    // also when two requests arrive at the same time (the row is locked).
    Task<(RedeemOutcome Outcome, int EmployeeId)> RedeemAsync(byte[] tokenHash, DateTime now, Func<string> passwordHash);
}
