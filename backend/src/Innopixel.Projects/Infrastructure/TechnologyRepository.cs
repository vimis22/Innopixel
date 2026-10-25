namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class TechnologyRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ITechnologyRepository
{
    public Task<OperationResult> CreateTechnologyAsync(Technology technologyInfo) =>
        ExecuteAsync("INSERT INTO technology (name) VALUES (@Name)", technologyInfo);

    public Task<IReadOnlyList<Technology>> GetTechnologyByIdAsync(int technologyId) =>
        QueryAsync<Technology>("SELECT * FROM technology WHERE id = @TechnologyId", new { TechnologyId = technologyId });

    public Task<IReadOnlyList<Technology>> GetTechnologyByAllInfoAsync(string name) =>
        QueryAsync<Technology>("SELECT * FROM technology WHERE name = @Name", new { Name = name });

    public Task<IReadOnlyList<Technology>> GetAllTechnologiesAsync() =>
        QueryAsync<Technology>("SELECT * FROM technology ORDER BY name");

    public Task<IReadOnlyList<Technology>> GetTechnologiesByProjectsIdAsync(int projectsId) =>
        QueryAsync<Technology>(
            """
            SELECT t.*
            FROM technology t
            JOIN technologylist tl ON tl.technology_id = t.id
            WHERE tl.projects_id = @ProjectsId
            ORDER BY t.name
            """,
            new { ProjectsId = projectsId });

    public Task<OperationResult> UpdateTechnologyByFullAsync(Technology technology, string name) =>
        ExecuteAsync("UPDATE technology SET name = @Name WHERE id = @Id", new { technology.Id, Name = name });

    // Fjerner også teknologiens koblinger til projekter.
    public Task<OperationResult> DeleteTechnologyByAllInfoAsync(Technology technology) =>
        ExecuteAsync(
            """
            WITH links AS (DELETE FROM technologylist WHERE technology_id = @Id)
            DELETE FROM technology WHERE id = @Id
            """,
            new { technology.Id });
}
