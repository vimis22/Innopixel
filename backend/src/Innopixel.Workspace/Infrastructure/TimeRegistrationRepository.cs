namespace Innopixel.Workspace.Infrastructure;

using System.Data;
using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Domain;

// En registrering ejes af brugeren i workloglist. Alle forespørgsler er parametriserede.
public class TimeRegistrationRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ITimeRegistrationRepository
{
    private const string SelectLogs = """
        SELECT w.id, w.description, w."date", w.checkin, w.checkout, w.projects_id, p.name AS project_name,
               w.break_minutes, w.status, w.approved_by, w.approved_at, wl.user_id
        FROM worklog w
        JOIN workloglist wl ON wl.worklog_id = w.id
        LEFT JOIN projects p ON p.id = w.projects_id
        """;

    public Task<WsWorkLog?> GetByIdAsync(int worklogId) =>
        QuerySingleAsync<WsWorkLog>($"{SelectLogs} WHERE w.id = @Id LIMIT 1", new { Id = worklogId });

    public Task<WsWorkLog?> GetActiveAsync(int userId) =>
        QuerySingleAsync<WsWorkLog>($"{SelectLogs} WHERE wl.user_id = @UserId AND w.checkout IS NULL LIMIT 1", new { UserId = userId });

    public Task<WsWorkLog?> GetLatestAsync(int userId) =>
        QuerySingleAsync<WsWorkLog>(
            $"{SelectLogs} WHERE wl.user_id = @UserId ORDER BY COALESCE(w.checkout, w.checkin) DESC, w.id DESC LIMIT 1",
            new { UserId = userId });

    public Task<IReadOnlyList<WsWorkLog>> GetByDateRangeAsync(int? userId, DateOnly from, DateOnly to) =>
        QueryAsync<WsWorkLog>(
            $"""
            {SelectLogs}
            WHERE w."date" BETWEEN @From AND @To AND (@UserId IS NULL OR wl.user_id = @UserId)
            ORDER BY w."date" DESC, w.checkin DESC
            """,
            new { UserId = userId, From = from.ToDateTime(TimeOnly.MinValue), To = to.ToDateTime(TimeOnly.MinValue) });

    public Task<IReadOnlyList<WsWorkLog>> GetPendingAsync(int? userId) =>
        QueryAsync<WsWorkLog>(
            $"""
            {SelectLogs}
            WHERE w.status = 'PENDING' AND w.checkout IS NOT NULL AND (@UserId IS NULL OR wl.user_id = @UserId)
            ORDER BY w."date" DESC
            """,
            new { UserId = userId });

    public async Task<IReadOnlyList<WsWorkLogBreak>> GetBreaksAsync(IReadOnlyCollection<int> worklogIds) =>
        worklogIds.Count == 0
            ? []
            : await QueryAsync<WsWorkLogBreak>(
                "SELECT * FROM worklogbreak WHERE worklog_id = ANY(@Ids) ORDER BY start_at",
                new { Ids = worklogIds.ToArray() });

    public Task<string?> GetSelectableProjectNameAsync(int projectId, int userId, bool isAdmin) =>
        QuerySingleAsync<string>(
            """
            SELECT p.name
            FROM projects p
            WHERE p.id = @ProjectId AND p.manager_id IS NOT NULL AND p.archived = false
              AND (@IsAdmin OR p.manager_id = @UserId
                   OR EXISTS (SELECT 1 FROM projectmember m WHERE m.projects_id = p.id AND m.employee_id = @UserId))
            """,
            new { ProjectId = projectId, UserId = userId, IsAdmin = isAdmin });

    // Databasefejl kastes videre: reglerne er tjekket i servicen, så en fejl her er uventet.
    public async Task<T> WriteAsync<T>(int userId, Func<ITimeWriter, Task<T>> changes)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync("SELECT id FROM employee WHERE id = @Id FOR UPDATE", new { Id = userId }, transaction);

        var result = await changes(new Writer(connection, transaction));
        transaction.Commit();
        return result;
    }

    private sealed class Writer(IDbConnection connection, IDbTransaction transaction) : ITimeWriter
    {
        public Task<WsWorkLog?> GetActiveAsync(int userId) =>
            connection.QuerySingleOrDefaultAsync<WsWorkLog?>(
                $"{SelectLogs} WHERE wl.user_id = @UserId AND w.checkout IS NULL LIMIT 1", new { UserId = userId }, transaction);

        // Overlapper [start, end) med en anden af medarbejderens registreringer? En aktiv registrering løber "for evigt".
        public Task<bool> HasOverlapAsync(int userId, DateTime start, DateTime end, int? exceptWorklogId) =>
            connection.ExecuteScalarAsync<bool>(
                """
                SELECT EXISTS (
                    SELECT 1 FROM worklog w JOIN workloglist wl ON wl.worklog_id = w.id
                    WHERE wl.user_id = @UserId AND w.id <> COALESCE(@ExceptId, -1)
                      AND w.checkin < @End AND COALESCE(w.checkout, 'infinity'::timestamptz) > @Start)
                """,
                new { UserId = userId, Start = start, End = end, ExceptId = exceptWorklogId }, transaction);

        public async Task<int> InsertAsync(WsWorkLog log)
        {
            var id = await connection.ExecuteScalarAsync<int>(
                """
                INSERT INTO worklog (description, "date", checkin, checkout, projects_id, break_minutes, status, approved_by, approved_at)
                VALUES (@Description, @Date, @Checkin, @Checkout, @ProjectsId, @BreakMinutes, @Status, @ApprovedBy, @ApprovedAt)
                RETURNING id
                """,
                log, transaction);

            await connection.ExecuteAsync(
                "INSERT INTO workloglist (worklog_id, user_id) VALUES (@WorklogId, @UserId)",
                new { WorklogId = id, log.UserId }, transaction);
            return id;
        }

        public Task UpdateAsync(WsWorkLog log) =>
            connection.ExecuteAsync(
                """
                UPDATE worklog
                SET description = @Description, "date" = @Date, checkin = @Checkin, checkout = @Checkout,
                    projects_id = @ProjectsId, break_minutes = @BreakMinutes, status = @Status,
                    approved_by = @ApprovedBy, approved_at = @ApprovedAt, updated_at = now()
                WHERE id = @Id
                """,
                log, transaction);

        public Task DeleteAsync(int worklogId) =>
            connection.ExecuteAsync(
                """
                WITH breaks AS (DELETE FROM worklogbreak WHERE worklog_id = @Id),
                     links AS (DELETE FROM workloglist WHERE worklog_id = @Id)
                DELETE FROM worklog WHERE id = @Id
                """,
                new { Id = worklogId }, transaction);

        public async Task<IReadOnlyList<WsWorkLogBreak>> GetBreaksAsync(int worklogId) =>
            (await connection.QueryAsync<WsWorkLogBreak>(
                "SELECT * FROM worklogbreak WHERE worklog_id = @Id ORDER BY start_at", new { Id = worklogId }, transaction)).AsList();

        public Task StartBreakAsync(int worklogId, DateTime at) =>
            connection.ExecuteAsync(
                "INSERT INTO worklogbreak (worklog_id, start_at) VALUES (@Id, @At)", new { Id = worklogId, At = at }, transaction);

        public Task EndOpenBreakAsync(int worklogId, DateTime at) =>
            connection.ExecuteAsync(
                "UPDATE worklogbreak SET end_at = GREATEST(@At, start_at) WHERE worklog_id = @Id AND end_at IS NULL",
                new { Id = worklogId, At = at }, transaction);
    }
}
