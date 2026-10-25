namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface IProjectsRepository
{
    Task<OperationResult> CreateProjectsAsync(Projects projectsInfo);

    // Som CreateProjectsAsync, men returnerer det nye id (eller null), så projektet kan kobles til teknologier m.m.
    Task<int?> CreateProjectsAndGetIdAsync(Projects projectsInfo);

    Task<IReadOnlyList<Projects>> GetProjectsByIdAsync(int projectsId);
    Task<IReadOnlyList<Projects>> GetProjectsByAllInfoAsync(string name, string? description, DateTime? deadline, string currentStatus);
    Task<IReadOnlyList<Projects>> GetProjectsByNameAsync(string name);
    Task<IReadOnlyList<Projects>> GetProjectsByDescriptionAsync(string description);
    Task<IReadOnlyList<Projects>> GetProjectsByDeadlineAsync(DateTime deadline);
    Task<IReadOnlyList<Projects>> GetProjectsByCurrentStatusAsync(string currentStatus);

    Task<IReadOnlyList<Projects>> GetAllProjectsAsync();

    // Filtrering (US-08). null betyder "intet filter" for den parameter.
    Task<IReadOnlyList<Projects>> GetProjectsByFilterAsync(string? currentStatus, int? categoryId, int? technologyId);

    Task<OperationResult> UpdateProjectsByFullAsync(Projects projects, string name, string? description, DateTime? deadline, string currentStatus);
    Task<OperationResult> UpdateProjectsByNameAsync(Projects projects, string name);
    Task<OperationResult> UpdateProjectsByDescriptionAsync(Projects projects, string? description);
    Task<OperationResult> UpdateProjectsByDeadlineAsync(Projects projects, DateTime? deadline);
    Task<OperationResult> UpdateProjectsByCurrentStatusAsync(Projects projects, string currentStatus);

    Task<OperationResult> DeleteProjectsByAllInfoAsync(Projects projects);
}
