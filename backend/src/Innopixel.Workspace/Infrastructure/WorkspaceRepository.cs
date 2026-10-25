namespace Innopixel.Workspace.Infrastructure;

using System.Data;
using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Domain;

public class WorkspaceRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IWorkspaceRepository
{
    // Kun projekter med en projektleder hører til platformen; de øvrige er porteføljeprojekter til hjemmesiden.
    private const string PlatformProjects = "SELECT id FROM projects WHERE manager_id IS NOT NULL";

    public async Task<WorkspaceSnapshot> GetSnapshotAsync()
    {
        using var connection = ConnectionFactory.CreateConnection();
        using var grid = await connection.QueryMultipleAsync(
            $"""
            SELECT id, name, description, client, manager_id, workstatus, start_date, deadline, image_url, archived, created_at, updated_at
            FROM projects WHERE manager_id IS NOT NULL ORDER BY id;

            SELECT projects_id, employee_id, added_at FROM projectmember
            WHERE projects_id IN ({PlatformProjects}) ORDER BY added_at;

            SELECT * FROM task WHERE projects_id IN ({PlatformProjects}) ORDER BY start_date, id;

            SELECT c.* FROM checklistitem c JOIN task t ON t.id = c.task_id
            WHERE t.projects_id IN ({PlatformProjects}) ORDER BY c.task_id, c.sortorder, c.id;

            SELECT d.* FROM taskdependency d JOIN task t ON t.id = d.successor_id
            WHERE t.projects_id IN ({PlatformProjects}) ORDER BY d.id;

            SELECT * FROM milestone WHERE projects_id IN ({PlatformProjects}) ORDER BY due_date, id;
            """);

        return new WorkspaceSnapshot(
            (await grid.ReadAsync<WsProject>()).AsList(),
            (await grid.ReadAsync<WsMember>()).AsList(),
            (await grid.ReadAsync<WsTask>()).AsList(),
            (await grid.ReadAsync<WsChecklistItem>()).AsList(),
            (await grid.ReadAsync<WsDependency>()).AsList(),
            (await grid.ReadAsync<WsMilestone>()).AsList());
    }

    public Task<IReadOnlyList<WsStatusHistory>> GetStatusHistoryAsync() =>
        QueryAsync<WsStatusHistory>(
            $"""
            SELECT id, projects_id, name, comment, changedat, changedby FROM progress
            WHERE projects_id IN ({PlatformProjects}) ORDER BY changedat, id
            """);

    public Task<IReadOnlyList<WsActivity>> GetRecentActivityAsync(int limit) =>
        QueryAsync<WsActivity>("SELECT * FROM activitylog ORDER BY created_at DESC, id DESC LIMIT @Limit", new { Limit = limit });

    public Task WriteAsync(Func<IWorkspaceWriter, Task> changes) =>
        WriteAsync(async writer =>
        {
            await changes(writer);
            return true;
        });

    // Fejl kastes videre: platformens regler er allerede tjekket, så en databasefejl her er uventet.
    public async Task<T> WriteAsync<T>(Func<IWorkspaceWriter, Task<T>> changes)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var result = await changes(new Writer(connection, transaction));
        transaction.Commit();
        return result;
    }

    private sealed class Writer(IDbConnection connection, IDbTransaction transaction) : IWorkspaceWriter
    {
        public Task<int> InsertProjectAsync(WsProject project) =>
            Scalar(
                """
                INSERT INTO projects (name, description, client, manager_id, workstatus, start_date, deadline, image_url,
                                      archived, currentstatus, created_at, updated_at)
                VALUES (@Name, @Description, @Client, @ManagerId, @Workstatus, @StartDate, @Deadline, @ImageUrl,
                        false, 'Draft', @CreatedAt, @UpdatedAt)
                RETURNING id
                """,
                project);

        public Task UpdateProjectAsync(WsProject project) =>
            Execute(
                """
                UPDATE projects
                SET name = @Name, description = @Description, client = @Client, manager_id = @ManagerId,
                    workstatus = @Workstatus, start_date = @StartDate, deadline = @Deadline, image_url = @ImageUrl,
                    updated_at = @UpdatedAt
                WHERE id = @Id
                """,
                project);

        public Task SetProjectArchivedAsync(int projectId, bool archived, DateTime updatedAt) =>
            Execute("UPDATE projects SET archived = @Archived, updated_at = @UpdatedAt WHERE id = @Id",
                new { Id = projectId, Archived = archived, UpdatedAt = updatedAt });

        public Task AddMemberAsync(int projectId, int employeeId, DateTime addedAt) =>
            Execute(
                """
                INSERT INTO projectmember (projects_id, employee_id, added_at) VALUES (@ProjectId, @EmployeeId, @AddedAt)
                ON CONFLICT (projects_id, employee_id) DO NOTHING
                """,
                new { ProjectId = projectId, EmployeeId = employeeId, AddedAt = addedAt });

        public Task RemoveMemberAsync(int projectId, int employeeId) =>
            Execute("DELETE FROM projectmember WHERE projects_id = @ProjectId AND employee_id = @EmployeeId",
                new { ProjectId = projectId, EmployeeId = employeeId });

        public Task UnassignOpenTasksAsync(int projectId, int employeeId) =>
            Execute(
                "UPDATE task SET assignee_id = NULL WHERE projects_id = @ProjectId AND assignee_id = @EmployeeId AND status <> 'DONE'",
                new { ProjectId = projectId, EmployeeId = employeeId });

        public Task AddStatusHistoryAsync(int projectId, string? from, string to, int changedBy, DateTime changedAt) =>
            Execute(
                "INSERT INTO progress (name, comment, changedat, changedby, projects_id) VALUES (@To, @From, @ChangedAt, @ChangedBy, @ProjectId)",
                new { ProjectId = projectId, From = from, To = to, ChangedBy = changedBy.ToString(), ChangedAt = changedAt });

        public Task<int> InsertTaskAsync(WsTask task) =>
            Scalar(
                """
                INSERT INTO task (projects_id, title, description, status, priority, assignee_id, taskgroup, start_date,
                                  due_date, progress, estimate_hours, milestone_id, created_at, updated_at)
                VALUES (@ProjectsId, @Title, @Description, @Status, @Priority, @AssigneeId, @Taskgroup, @StartDate,
                        @DueDate, @Progress, @EstimateHours, @MilestoneId, @CreatedAt, @UpdatedAt)
                RETURNING id
                """,
                task);

        public Task UpdateTaskAsync(WsTask task) =>
            Execute(
                """
                UPDATE task
                SET title = @Title, description = @Description, status = @Status, priority = @Priority,
                    assignee_id = @AssigneeId, taskgroup = @Taskgroup, start_date = @StartDate, due_date = @DueDate,
                    progress = @Progress, estimate_hours = @EstimateHours, milestone_id = @MilestoneId, updated_at = @UpdatedAt
                WHERE id = @Id
                """,
                task);

        // Fjerner også opgavens tjekliste og afhængigheder i samme SQL-sætning.
        public Task DeleteTaskAsync(int taskId) =>
            Execute(
                """
                WITH checklist AS (DELETE FROM checklistitem WHERE task_id = @Id),
                     dependencies AS (DELETE FROM taskdependency WHERE predecessor_id = @Id OR successor_id = @Id)
                DELETE FROM task WHERE id = @Id
                """,
                new { Id = taskId });

        public async Task SetPredecessorsAsync(int taskId, IReadOnlyCollection<int> predecessorIds)
        {
            await Execute("DELETE FROM taskdependency WHERE successor_id = @Id", new { Id = taskId });
            await Execute(
                "INSERT INTO taskdependency (predecessor_id, successor_id) VALUES (@PredecessorId, @SuccessorId)",
                predecessorIds.Distinct().Select(id => new { PredecessorId = id, SuccessorId = taskId }));
        }

        public async Task SetChecklistAsync(int taskId, IReadOnlyList<WsChecklistItem> items)
        {
            await Execute("DELETE FROM checklistitem WHERE task_id = @Id", new { Id = taskId });
            await Execute(
                "INSERT INTO checklistitem (task_id, text, done, sortorder) VALUES (@TaskId, @Text, @Done, @Sortorder)",
                items.Select((item, index) => new { TaskId = taskId, item.Text, item.Done, Sortorder = index }));
        }

        public Task SetTaskMilestoneAsync(int taskId, int? milestoneId) =>
            Execute("UPDATE task SET milestone_id = @MilestoneId WHERE id = @Id", new { Id = taskId, MilestoneId = milestoneId });

        public Task<int> InsertMilestoneAsync(WsMilestone milestone) =>
            Scalar(
                """
                INSERT INTO milestone (projects_id, title, description, due_date, completedmanually, completedat, created_at)
                VALUES (@ProjectsId, @Title, @Description, @DueDate, @Completedmanually, @Completedat, @CreatedAt)
                RETURNING id
                """,
                milestone);

        public Task UpdateMilestoneAsync(WsMilestone milestone) =>
            Execute(
                """
                UPDATE milestone
                SET title = @Title, description = @Description, due_date = @DueDate,
                    completedmanually = @Completedmanually, completedat = @Completedat
                WHERE id = @Id
                """,
                milestone);

        public Task DeleteMilestoneAsync(int milestoneId) =>
            Execute(
                """
                WITH tasks AS (UPDATE task SET milestone_id = NULL WHERE milestone_id = @Id)
                DELETE FROM milestone WHERE id = @Id
                """,
                new { Id = milestoneId });

        public Task LogAsync(string type, int actorId, int? projectId, int? taskId, string message, DateTime createdAt) =>
            Execute(
                """
                INSERT INTO activitylog (type, actor_id, projects_id, task_id, message, created_at)
                VALUES (@Type, @ActorId, @ProjectId, @TaskId, @Message, @CreatedAt)
                """,
                new { Type = type, ActorId = actorId, ProjectId = projectId, TaskId = taskId, Message = message, CreatedAt = createdAt });

        private Task Execute(string sql, object param) => connection.ExecuteAsync(sql, param, transaction);

        private Task<int> Scalar(string sql, object param) => connection.ExecuteScalarAsync<int>(sql, param, transaction);
    }
}
