namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ServicesRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IServicesRepository
{
    private const string SelectServices = "SELECT * FROM services WHERE ";

    public async Task<OperationResult> CreateServicesAsync(Services servicesInfo) =>
        await CreateServicesAndGetIdAsync(servicesInfo) is null ? OperationResult.Failed : OperationResult.Success;

    public Task<int?> CreateServicesAndGetIdAsync(Services servicesInfo) =>
        InsertReturningIdAsync(
            "INSERT INTO services (projectdescription, iconidentifier) VALUES (@ProjectDescription, @IconIdentifier) RETURNING id",
            servicesInfo);

    public Task<IReadOnlyList<Services>> GetServicesByIdAsync(int servicesId) =>
        QueryAsync<Services>(SelectServices + "id = @ServicesId", new { ServicesId = servicesId });

    public Task<IReadOnlyList<Services>> GetServicesByAllInfoAsync(string projectDescription, string? iconIdentifier) =>
        QueryAsync<Services>(
            SelectServices + "projectdescription = @ProjectDescription AND iconidentifier IS NOT DISTINCT FROM @IconIdentifier",
            new { ProjectDescription = projectDescription, IconIdentifier = iconIdentifier });

    public Task<IReadOnlyList<Services>> GetServicesByProjectDescriptionAsync(string projectDescription) =>
        QueryAsync<Services>(SelectServices + "projectdescription = @ProjectDescription", new { ProjectDescription = projectDescription });

    public Task<IReadOnlyList<Services>> GetServicesByIconIdentifierAsync(string iconIdentifier) =>
        QueryAsync<Services>(SelectServices + "iconidentifier = @IconIdentifier", new { IconIdentifier = iconIdentifier });

    public Task<IReadOnlyList<Services>> GetAllServicesAsync() =>
        QueryAsync<Services>("SELECT * FROM services ORDER BY id");

    public Task<IReadOnlyList<Services>> GetServicesByProjectsIdAsync(int projectsId) =>
        QueryAsync<Services>(
            """
            SELECT s.*
            FROM services s
            JOIN projectlist pl ON pl.services_id = s.id
            WHERE pl.projects_id = @ProjectsId
            ORDER BY s.id
            """,
            new { ProjectsId = projectsId });

    public Task<OperationResult> UpdateServicesByFullAsync(Services services, string projectDescription, string? iconIdentifier) =>
        ExecuteAsync(
            "UPDATE services SET projectdescription = @ProjectDescription, iconidentifier = @IconIdentifier WHERE id = @Id",
            new { services.Id, ProjectDescription = projectDescription, IconIdentifier = iconIdentifier });

    public Task<OperationResult> UpdateServicesByProjectDescriptionAsync(Services services, string projectDescription) =>
        ExecuteAsync("UPDATE services SET projectdescription = @ProjectDescription WHERE id = @Id", new { services.Id, ProjectDescription = projectDescription });

    public Task<OperationResult> UpdateServicesByIconIdentifierAsync(Services services, string? iconIdentifier) =>
        ExecuteAsync("UPDATE services SET iconidentifier = @IconIdentifier WHERE id = @Id", new { services.Id, IconIdentifier = iconIdentifier });

    // Fjerner også servicens koblinger til projekter, tekster og rettigheder.
    // SERVICELIST tilhører User-modulet, men ligger i samme database.
    public Task<OperationResult> DeleteServicesByAllInfoAsync(Services services) =>
        ExecuteAsync(
            """
            WITH projects AS (DELETE FROM projectlist WHERE services_id = @Id),
                 languages AS (DELETE FROM languagelist WHERE services_id = @Id),
                 rights AS (DELETE FROM servicelist WHERE services_id = @Id)
            DELETE FROM services WHERE id = @Id
            """,
            new { services.Id });
}
