namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Relationen PROJECTS <-> TECHNOLOGY.
public interface ITechnologyListRepository
{
    Task<OperationResult> CreateTechnologyListAsync(TechnologyList technologyListInfo);

    Task<IReadOnlyList<TechnologyList>> GetTechnologyListByFullAsync(int projectId, int technologyId);
    Task<IReadOnlyList<TechnologyList>> GetTechnologyListByProjectIdAsync(int projectId);
    Task<IReadOnlyList<TechnologyList>> GetTechnologyListByTechnologyIdAsync(int technologyId);

    // Erstatter alle projektets teknologier med technologyIds.
    Task<OperationResult> UpdateTechnologyListByTechnologiesAsync(int projectId, IReadOnlyList<int> technologyIds);

    Task<OperationResult> DeleteTechnologyListByAllAsync(int projectId, int technologyId);
}
