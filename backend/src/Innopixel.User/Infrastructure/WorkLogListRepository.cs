namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class WorkLogListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IWorkLogListRepository
{
    private const string SelectWorkLogList = "SELECT * FROM workloglist WHERE ";

    public Task<OperationResult> CreateWorkLogListAsync(WorkLogList workLogListInfo) =>
        ExecuteAsync(
            "INSERT INTO workloglist (worklog_id, user_id) VALUES (@WorkLogId, @UserId)",
            workLogListInfo);

    public Task<IReadOnlyList<WorkLogList>> GetWorkLogListByFullAsync(int userId, int workLogId) =>
        QueryAsync<WorkLogList>(
            SelectWorkLogList + "user_id = @UserId AND worklog_id = @WorkLogId",
            new { UserId = userId, WorkLogId = workLogId });

    public Task<IReadOnlyList<WorkLogList>> GetWorkLogListByUserIdAsync(int userId) =>
        QueryAsync<WorkLogList>(SelectWorkLogList + "user_id = @UserId", new { UserId = userId });

    public Task<IReadOnlyList<WorkLogList>> GetWorkLogListByWorkLogIdAsync(int workLogId) =>
        QueryAsync<WorkLogList>(SelectWorkLogList + "worklog_id = @WorkLogId", new { WorkLogId = workLogId });

    public Task<IReadOnlyList<WorkLogList>> GetWorkLogListByDateRangeAsync(int userId, DateTime fromDate, DateTime toDate) =>
        QueryAsync<WorkLogList>(
            """
            SELECT wl.*
            FROM workloglist wl
            JOIN worklog w ON w.id = wl.worklog_id
            WHERE wl.user_id = @UserId AND w."date" BETWEEN @FromDate AND @ToDate
            """,
            new { UserId = userId, FromDate = fromDate, ToDate = toDate });

    public Task<OperationResult> UpdateWorkLogListByUserAsync(int workLogId, int oldUserId, int newUserId) =>
        ExecuteAsync(
            "UPDATE workloglist SET user_id = @NewUserId WHERE worklog_id = @WorkLogId AND user_id = @OldUserId",
            new { WorkLogId = workLogId, OldUserId = oldUserId, NewUserId = newUserId });

    public Task<OperationResult> DeleteWorkLogListByAllAsync(int userId, int workLogId) =>
        ExecuteAsync(
            "DELETE FROM workloglist WHERE user_id = @UserId AND worklog_id = @WorkLogId",
            new { UserId = userId, WorkLogId = workLogId });
}
