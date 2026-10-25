namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface IServicesRepository
{
    Task<OperationResult> CreateServicesAsync(Services servicesInfo);

    // Som CreateServicesAsync, men returnerer det nye id (eller null), så servicen kan kobles til tekster.
    Task<int?> CreateServicesAndGetIdAsync(Services servicesInfo);

    Task<IReadOnlyList<Services>> GetServicesByIdAsync(int servicesId);
    Task<IReadOnlyList<Services>> GetServicesByAllInfoAsync(string projectDescription, string? iconIdentifier);
    Task<IReadOnlyList<Services>> GetServicesByProjectDescriptionAsync(string projectDescription);
    Task<IReadOnlyList<Services>> GetServicesByIconIdentifierAsync(string iconIdentifier);
    Task<IReadOnlyList<Services>> GetAllServicesAsync();
    Task<IReadOnlyList<Services>> GetServicesByProjectsIdAsync(int projectsId);

    Task<OperationResult> UpdateServicesByFullAsync(Services services, string projectDescription, string? iconIdentifier);
    Task<OperationResult> UpdateServicesByProjectDescriptionAsync(Services services, string projectDescription);
    Task<OperationResult> UpdateServicesByIconIdentifierAsync(Services services, string? iconIdentifier);

    Task<OperationResult> DeleteServicesByAllInfoAsync(Services services);
}
