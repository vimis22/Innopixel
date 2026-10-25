namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Relationen PROJECTS <-> SERVICES.
public interface IProjectListRepository
{
    Task<OperationResult> CreateProjectListAsync(ProjectList projectListInfo);

    Task<IReadOnlyList<ProjectList>> GetProjectListByFullAsync(int projectId, int serviceId);
    Task<IReadOnlyList<ProjectList>> GetProjectListByProjectIdAsync(int projectId);
    Task<IReadOnlyList<ProjectList>> GetProjectListByServiceIdAsync(int serviceId);

    // Erstatter alle projektets services med serviceIds.
    Task<OperationResult> UpdateProjectListByServicesAsync(int projectId, IReadOnlyList<int> serviceIds);

    Task<OperationResult> DeleteProjectListByAllAsync(int projectId, int serviceId);
}
