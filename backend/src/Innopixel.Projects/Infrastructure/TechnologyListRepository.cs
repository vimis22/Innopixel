namespace Innopixel.Projects.Infrastructure;

using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class TechnologyListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ITechnologyListRepository
{
    private const string SelectTechnologyList = "SELECT * FROM technologylist WHERE ";
    private const string InsertTechnologyList = "INSERT INTO technologylist (projects_id, technology_id) VALUES (@ProjectsId, @TechnologyId)";

    public Task<OperationResult> CreateTechnologyListAsync(TechnologyList technologyListInfo) =>
        ExecuteAsync(InsertTechnologyList, technologyListInfo);

    public Task<IReadOnlyList<TechnologyList>> GetTechnologyListByFullAsync(int projectId, int technologyId) =>
        QueryAsync<TechnologyList>(
            SelectTechnologyList + "projects_id = @ProjectsId AND technology_id = @TechnologyId",
            new { ProjectsId = projectId, TechnologyId = technologyId });

    public Task<IReadOnlyList<TechnologyList>> GetTechnologyListByProjectIdAsync(int projectId) =>
        QueryAsync<TechnologyList>(SelectTechnologyList + "projects_id = @ProjectsId", new { ProjectsId = projectId });

    public Task<IReadOnlyList<TechnologyList>> GetTechnologyListByTechnologyIdAsync(int technologyId) =>
        QueryAsync<TechnologyList>(SelectTechnologyList + "technology_id = @TechnologyId", new { TechnologyId = technologyId });

    public Task<OperationResult> UpdateTechnologyListByTechnologiesAsync(int projectId, IReadOnlyList<int> technologyIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM technologylist WHERE projects_id = @ProjectsId",
                new { ProjectsId = projectId }, transaction);

            await connection.ExecuteAsync(
                InsertTechnologyList,
                technologyIds.Distinct().Select(technologyId => new { ProjectsId = projectId, TechnologyId = technologyId }),
                transaction);
        });

    public Task<OperationResult> DeleteTechnologyListByAllAsync(int projectId, int technologyId) =>
        ExecuteAsync(
            "DELETE FROM technologylist WHERE projects_id = @ProjectsId AND technology_id = @TechnologyId",
            new { ProjectsId = projectId, TechnologyId = technologyId });
}
