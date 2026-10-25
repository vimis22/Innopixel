namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

// "date" står i anførselstegn, fordi DATE også er en datatype i PostgreSQL.
public class WorkLogRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IWorkLogRepository
{
    private const string SelectWorkLogs = "SELECT * FROM worklog WHERE ";

    // Opretter worklog'en og kobler den til brugeren i samme transaktion, hvis UserId er sat.
    public Task<OperationResult> CreateWorkLogAsync(WorkLogInfo workLogInfo) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            var workLogId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO worklog (description, \"date\", checkin, checkout) VALUES (@Description, @Date, @Checkin, @Checkout) RETURNING id",
                workLogInfo, transaction);

            if (workLogInfo.UserId is { } userId)
            {
                await connection.ExecuteAsync(
                    "INSERT INTO workloglist (worklog_id, user_id) VALUES (@WorkLogId, @UserId)",
                    new { WorkLogId = workLogId, UserId = userId }, transaction);
            }
        });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByIdAsync(int workLogId) =>
        QueryAsync<WorkLog>(SelectWorkLogs + "id = @WorkLogId", new { WorkLogId = workLogId });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByAllInfoAsync(DateTime checkin, DateTime? checkout, DateTime date, string? description) =>
        QueryAsync<WorkLog>(
            SelectWorkLogs + "checkin = @Checkin AND checkout IS NOT DISTINCT FROM @Checkout AND \"date\" = @Date AND description IS NOT DISTINCT FROM @Description",
            new { Checkin = checkin, Checkout = checkout, Date = date, Description = description });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByCheckinAsync(DateTime checkin) =>
        QueryAsync<WorkLog>(SelectWorkLogs + "checkin = @Checkin", new { Checkin = checkin });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByCheckoutAsync(DateTime checkout) =>
        QueryAsync<WorkLog>(SelectWorkLogs + "checkout = @Checkout", new { Checkout = checkout });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByDateAsync(DateTime date) =>
        QueryAsync<WorkLog>(SelectWorkLogs + "\"date\" = @Date", new { Date = date });

    public Task<IReadOnlyList<WorkLog>> GetWorkLogByDescriptionAsync(string description) =>
        QueryAsync<WorkLog>(SelectWorkLogs + "description = @Description", new { Description = description });

    public Task<OperationResult> UpdateWorkLogByFullAsync(WorkLog workLog, DateTime checkin, DateTime? checkout, DateTime date, string? description) =>
        ExecuteAsync(
            "UPDATE worklog SET checkin = @Checkin, checkout = @Checkout, \"date\" = @Date, description = @Description WHERE id = @Id",
            new { workLog.Id, Checkin = checkin, Checkout = checkout, Date = date, Description = description });

    public Task<OperationResult> UpdateWorkLogByCheckinAsync(WorkLog workLog, DateTime checkin) =>
        ExecuteAsync("UPDATE worklog SET checkin = @Checkin WHERE id = @Id", new { workLog.Id, Checkin = checkin });

    public Task<OperationResult> UpdateWorkLogByCheckoutAsync(WorkLog workLog, DateTime? checkout) =>
        ExecuteAsync("UPDATE worklog SET checkout = @Checkout WHERE id = @Id", new { workLog.Id, Checkout = checkout });

    public Task<OperationResult> UpdateWorkLogByDateAsync(WorkLog workLog, DateTime date) =>
        ExecuteAsync("UPDATE worklog SET \"date\" = @Date WHERE id = @Id", new { workLog.Id, Date = date });

    public Task<OperationResult> UpdateWorkLogByDescriptionAsync(WorkLog workLog, string? description) =>
        ExecuteAsync("UPDATE worklog SET description = @Description WHERE id = @Id", new { workLog.Id, Description = description });

    // Fjerner også koblingerne i WORKLOGLIST, da de ikke giver mening uden worklog'en.
    public Task<OperationResult> DeleteWorkLogByAllInfoAsync(WorkLog workLog) =>
        ExecuteAsync(
            """
            WITH links AS (DELETE FROM workloglist WHERE worklog_id = @Id),
                 breaks AS (DELETE FROM worklogbreak WHERE worklog_id = @Id)
            DELETE FROM worklog WHERE id = @Id
            """,
            new { workLog.Id });
}
