namespace Innopixel.Projects.Contracts;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Teknologier, som projekter kan tagges med (US-15).
public interface ITechnologyService
{
    Task<IReadOnlyList<Technology>> GetAllTechnologiesAsync();
    Task<ValidatedResult> CreateTechnologyAsync(string name);
    Task<ValidatedResult> RenameTechnologyAsync(int technologyId, string name);
    Task<OperationResult> DeleteTechnologyAsync(int technologyId);
}
