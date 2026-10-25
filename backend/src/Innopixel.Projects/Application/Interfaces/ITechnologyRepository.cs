namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface ITechnologyRepository
{
    Task<OperationResult> CreateTechnologyAsync(Technology technologyInfo);

    Task<IReadOnlyList<Technology>> GetTechnologyByIdAsync(int technologyId);
    Task<IReadOnlyList<Technology>> GetTechnologyByAllInfoAsync(string name);
    Task<IReadOnlyList<Technology>> GetAllTechnologiesAsync();
    Task<IReadOnlyList<Technology>> GetTechnologiesByProjectsIdAsync(int projectsId);

    Task<OperationResult> UpdateTechnologyByFullAsync(Technology technology, string name);

    Task<OperationResult> DeleteTechnologyByAllInfoAsync(Technology technology);
}
