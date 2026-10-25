namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ProjectsRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IProjectsRepository
{
    private const string SelectProjects = "SELECT * FROM projects WHERE ";

    private const string InsertProjects =
        "INSERT INTO projects (name, description, deadline, currentstatus, progress_id) VALUES (@Name, @Description, @Deadline, @CurrentStatus, @ProgressId) RETURNING id";

    public async Task<OperationResult> CreateProjectsAsync(Projects projectsInfo) =>
        await CreateProjectsAndGetIdAsync(projectsInfo) is null ? OperationResult.Failed : OperationResult.Success;

    public Task<int?> CreateProjectsAndGetIdAsync(Projects projectsInfo) =>
        InsertReturningIdAsync(InsertProjects, projectsInfo);

    public Task<IReadOnlyList<Projects>> GetProjectsByIdAsync(int projectsId) =>
        QueryAsync<Projects>(SelectProjects + "id = @ProjectsId", new { ProjectsId = projectsId });

    public Task<IReadOnlyList<Projects>> GetProjectsByAllInfoAsync(string name, string? description, DateTime? deadline, string currentStatus) =>
        QueryAsync<Projects>(
            SelectProjects + "name = @Name AND description IS NOT DISTINCT FROM @Description AND deadline IS NOT DISTINCT FROM @Deadline AND currentstatus = @CurrentStatus",
            new { Name = name, Description = description, Deadline = deadline, CurrentStatus = currentStatus });

    public Task<IReadOnlyList<Projects>> GetProjectsByNameAsync(string name) =>
        QueryAsync<Projects>(SelectProjects + "name = @Name", new { Name = name });

    public Task<IReadOnlyList<Projects>> GetProjectsByDescriptionAsync(string description) =>
        QueryAsync<Projects>(SelectProjects + "description = @Description", new { Description = description });

    public Task<IReadOnlyList<Projects>> GetProjectsByDeadlineAsync(DateTime deadline) =>
        QueryAsync<Projects>(SelectProjects + "deadline = @Deadline", new { Deadline = deadline });

    public Task<IReadOnlyList<Projects>> GetProjectsByCurrentStatusAsync(string currentStatus) =>
        QueryAsync<Projects>(SelectProjects + "currentstatus = @CurrentStatus", new { CurrentStatus = currentStatus });

    public Task<IReadOnlyList<Projects>> GetAllProjectsAsync() =>
        QueryAsync<Projects>("SELECT * FROM projects ORDER BY id DESC");

    public Task<IReadOnlyList<Projects>> GetProjectsByFilterAsync(string? currentStatus, int? categoryId, int? technologyId) =>
        QueryAsync<Projects>(
            """
            SELECT p.*
            FROM projects p
            WHERE (@CurrentStatus IS NULL OR p.currentstatus = @CurrentStatus)
              AND (@CategoryId IS NULL OR EXISTS (
                      SELECT 1 FROM categorylist cl WHERE cl.projects_id = p.id AND cl.category_id = @CategoryId))
              AND (@TechnologyId IS NULL OR EXISTS (
                      SELECT 1 FROM technologylist tl WHERE tl.projects_id = p.id AND tl.technology_id = @TechnologyId))
            ORDER BY p.id DESC
            """,
            new { CurrentStatus = currentStatus, CategoryId = categoryId, TechnologyId = technologyId });

    public Task<OperationResult> UpdateProjectsByFullAsync(Projects projects, string name, string? description, DateTime? deadline, string currentStatus) =>
        ExecuteAsync(
            "UPDATE projects SET name = @Name, description = @Description, deadline = @Deadline, currentstatus = @CurrentStatus WHERE id = @Id",
            new { projects.Id, Name = name, Description = description, Deadline = deadline, CurrentStatus = currentStatus });

    public Task<OperationResult> UpdateProjectsByNameAsync(Projects projects, string name) =>
        ExecuteAsync("UPDATE projects SET name = @Name WHERE id = @Id", new { projects.Id, Name = name });

    public Task<OperationResult> UpdateProjectsByDescriptionAsync(Projects projects, string? description) =>
        ExecuteAsync("UPDATE projects SET description = @Description WHERE id = @Id", new { projects.Id, Description = description });

    public Task<OperationResult> UpdateProjectsByDeadlineAsync(Projects projects, DateTime? deadline) =>
        ExecuteAsync("UPDATE projects SET deadline = @Deadline WHERE id = @Id", new { projects.Id, Deadline = deadline });

    public Task<OperationResult> UpdateProjectsByCurrentStatusAsync(Projects projects, string currentStatus) =>
        ExecuteAsync("UPDATE projects SET currentstatus = @CurrentStatus WHERE id = @Id", new { projects.Id, CurrentStatus = currentStatus });

    // Fjerner også projektets koblinger, tekster, progress-historik, AI-forslag, billedrækker og alt fra den interne
    // platform (opgaver, milepæle, medlemmer, aktivitet) i samme SQL-sætning.
    // IMAGE, AISUGGESTION og platformens tabeller tilhører andre moduler. Billedfilerne på disken fjernes
    // af IImagesService.DeleteProjectImagesAsync, som derfor skal kaldes før denne metode.
    public Task<OperationResult> DeleteProjectsByAllInfoAsync(Projects projects) =>
        ExecuteAsync(
            """
            WITH tasks AS (SELECT id FROM task WHERE projects_id = @Id),
                 services AS (DELETE FROM projectlist WHERE projects_id = @Id),
                 technologies AS (DELETE FROM technologylist WHERE projects_id = @Id),
                 categories AS (DELETE FROM categorylist WHERE projects_id = @Id),
                 clients AS (DELETE FROM clientlist WHERE projects_id = @Id),
                 texts AS (DELETE FROM projectlanguagelist WHERE projects_id = @Id),
                 progress AS (DELETE FROM progress WHERE projects_id = @Id),
                 images AS (DELETE FROM image WHERE projects_id = @Id),
                 suggestions AS (DELETE FROM aisuggestion WHERE projects_id = @Id),
                 checklist AS (DELETE FROM checklistitem WHERE task_id IN (SELECT id FROM tasks)),
                 dependencies AS (DELETE FROM taskdependency WHERE successor_id IN (SELECT id FROM tasks) OR predecessor_id IN (SELECT id FROM tasks)),
                 deleted_tasks AS (DELETE FROM task WHERE projects_id = @Id),
                 milestones AS (DELETE FROM milestone WHERE projects_id = @Id),
                 members AS (DELETE FROM projectmember WHERE projects_id = @Id),
                 activity AS (DELETE FROM activitylog WHERE projects_id = @Id),
                 worklogs AS (UPDATE worklog SET projects_id = NULL WHERE projects_id = @Id)
            DELETE FROM projects WHERE id = @Id
            """,
            new { projects.Id });
}
