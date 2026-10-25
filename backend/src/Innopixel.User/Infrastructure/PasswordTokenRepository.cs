namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;

// Table password_reset_token (database/005_password_management.sql)
public class PasswordTokenRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IPasswordTokenRepository
{
    public async Task CreateAsync(int employeeId, byte[] tokenHash, PasswordTokenPurpose purpose, DateTime createdAt, DateTime expiresAt, int? requestedBy)
    {
        using var connection = ConnectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            """
            INSERT INTO password_reset_token (employee_id, token_hash, purpose, created_at, expires_at, requested_by)
            VALUES (@EmployeeId, @Hash, @Purpose, @CreatedAt, @ExpiresAt, @RequestedBy)
            """,
            new { EmployeeId = employeeId, Hash = tokenHash, Purpose = ToDb(purpose), CreatedAt = createdAt, ExpiresAt = expiresAt, RequestedBy = requestedBy });
    }

    public async Task<int> CountSinceAsync(int employeeId, DateTime since) =>
        await QuerySingleAsync<int>(
            "SELECT count(*)::int FROM password_reset_token WHERE employee_id = @EmployeeId AND created_at >= @Since",
            new { EmployeeId = employeeId, Since = since });

    public async Task<PasswordTokenRecord?> FindAsync(byte[] tokenHash) =>
        (await QuerySingleAsync<TokenRow>(
            "SELECT employee_id, purpose, expires_at, used_at FROM password_reset_token WHERE token_hash = @Hash",
            new { Hash = tokenHash }))?.ToRecord();

    public async Task InvalidateOpenAsync(int employeeId, DateTime at)
    {
        using var connection = ConnectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            "UPDATE password_reset_token SET used_at = @At WHERE employee_id = @EmployeeId AND used_at IS NULL",
            new { EmployeeId = employeeId, At = at });
    }

    public async Task<(RedeemOutcome Outcome, int EmployeeId)> RedeemAsync(byte[] tokenHash, DateTime now, Func<string> passwordHash)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var token = await connection.QuerySingleOrDefaultAsync<TokenRow>(
            """
            SELECT t.employee_id, t.purpose, t.expires_at, t.used_at, e.active
            FROM password_reset_token t
            JOIN employee e ON e.id = t.employee_id
            WHERE t.token_hash = @Hash
            FOR UPDATE OF t
            """,
            new { Hash = tokenHash }, transaction);

        var outcome = token switch
        {
            null or { Active: false } => RedeemOutcome.Invalid,
            { UsedAt: not null } => RedeemOutcome.Used,
            _ when token.ExpiresAt <= now => RedeemOutcome.Expired,
            _ => RedeemOutcome.Success
        };
        if (outcome != RedeemOutcome.Success)
        {
            return (outcome, 0);
        }

        await connection.ExecuteAsync(
            """
            UPDATE employee SET password_hash = @PasswordHash, must_change_password = false, security_stamp = gen_random_uuid()
            WHERE id = @EmployeeId
            """,
            new { token!.EmployeeId, PasswordHash = passwordHash() }, transaction);

        await connection.ExecuteAsync(
            "UPDATE password_reset_token SET used_at = @Now WHERE employee_id = @EmployeeId AND used_at IS NULL",
            new { token.EmployeeId, Now = now }, transaction);

        transaction.Commit();
        return (RedeemOutcome.Success, token.EmployeeId);
    }

    private static string ToDb(PasswordTokenPurpose purpose) => purpose == PasswordTokenPurpose.Invite ? "INVITE" : "RESET";

    private sealed class TokenRow
    {
        public int EmployeeId { get; set; }
        public string Purpose { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public bool Active { get; set; } = true;

        public PasswordTokenRecord ToRecord() => new(
            EmployeeId,
            Purpose == "INVITE" ? PasswordTokenPurpose.Invite : PasswordTokenPurpose.Reset,
            DateTime.SpecifyKind(ExpiresAt, DateTimeKind.Utc),
            UsedAt is { } used ? DateTime.SpecifyKind(used, DateTimeKind.Utc) : null);
    }
}
