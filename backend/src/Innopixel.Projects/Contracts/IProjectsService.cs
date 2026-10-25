namespace Innopixel.Projects.Contracts;

using Innopixel.Projects.Contracts.Dtos;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface IProjectsService
{
    // --- Offentlig hjemmeside: kun publicerede projekter (US-06, US-07, US-08, US-17) ---
    Task<IReadOnlyList<Projects>> GetPublishedProjectsAsync(int? categoryId = null, int? technologyId = null);
    Task<ProjectDetails?> GetPublishedProjectDetailsAsync(int projectId);
    Task<bool> IsPublishedAsync(int projectId);

    // --- Administration (US-14, US-15, US-17) ---
    Task<IReadOnlyList<Projects>> GetAllProjectsAsync();
    Task<ProjectDetails?> GetProjectDetailsAsync(int projectId);

    // Nye projekter gemmes som kladde, medmindre CurrentStatus er sat. Id i resultatet er projektets id.
    Task<ValidatedResult> CreateProjectAsync(Projects project);
    Task<ValidatedResult> UpdateProjectAsync(Projects project);
    Task<OperationResult> PublishProjectAsync(int projectId);
    Task<OperationResult> UnpublishProjectAsync(int projectId);
    Task<OperationResult> DeleteProjectAsync(int projectId);

    Task<OperationResult> SetProjectTechnologiesAsync(int projectId, IReadOnlyList<int> technologyIds);
    Task<ValidatedResult> SetProjectCategoriesAsync(int projectId, IReadOnlyList<int> categoryIds, int? primaryCategoryId);
    Task<OperationResult> SetProjectServicesAsync(int projectId, IReadOnlyList<int> serviceIds);
}
