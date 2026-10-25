namespace Innopixel.Projects.Infrastructure;

using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ProjectListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IProjectListRepository
{
    private const string SelectProjectList = "SELECT * FROM projectlist WHERE ";
    private const string InsertProjectList = "INSERT INTO projectlist (projects_id, services_id) VALUES (@ProjectsId, @ServicesId)";

    public Task<OperationResult> CreateProjectListAsync(ProjectList projectListInfo) =>
        ExecuteAsync(InsertProjectList, projectListInfo);

    public Task<IReadOnlyList<ProjectList>> GetProjectListByFullAsync(int projectId, int serviceId) =>
        QueryAsync<ProjectList>(
            SelectProjectList + "projects_id = @ProjectsId AND services_id = @ServicesId",
            new { ProjectsId = projectId, ServicesId = serviceId });

    public Task<IReadOnlyList<ProjectList>> GetProjectListByProjectIdAsync(int projectId) =>
        QueryAsync<ProjectList>(SelectProjectList + "projects_id = @ProjectsId", new { ProjectsId = projectId });

    public Task<IReadOnlyList<ProjectList>> GetProjectListByServiceIdAsync(int serviceId) =>
        QueryAsync<ProjectList>(SelectProjectList + "services_id = @ServicesId", new { ServicesId = serviceId });

    public Task<OperationResult> UpdateProjectListByServicesAsync(int projectId, IReadOnlyList<int> serviceIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM projectlist WHERE projects_id = @ProjectsId",
                new { ProjectsId = projectId }, transaction);

            await connection.ExecuteAsync(
                InsertProjectList,
                serviceIds.Distinct().Select(serviceId => new { ProjectsId = projectId, ServicesId = serviceId }),
                transaction);
        });

    public Task<OperationResult> DeleteProjectListByAllAsync(int projectId, int serviceId) =>
        ExecuteAsync(
            "DELETE FROM projectlist WHERE projects_id = @ProjectsId AND services_id = @ServicesId",
            new { ProjectsId = projectId, ServicesId = serviceId });
}
