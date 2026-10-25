namespace Innopixel.Projects.Application;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public class TechnologyService(ITechnologyRepository technologyRepository) : ITechnologyService
{
    public Task<IReadOnlyList<Technology>> GetAllTechnologiesAsync() =>
        technologyRepository.GetAllTechnologiesAsync();

    public async Task<ValidatedResult> CreateTechnologyAsync(string name)
    {
        var errors = await ValidateAsync(name, excludeId: null);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await technologyRepository.CreateTechnologyAsync(new Technology { Name = name.Trim() }));
    }

    public async Task<ValidatedResult> RenameTechnologyAsync(int technologyId, string name)
    {
        var errors = await ValidateAsync(name, excludeId: technologyId);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await technologyRepository.UpdateTechnologyByFullAsync(new Technology { Id = technologyId }, name.Trim()));
    }

    public Task<OperationResult> DeleteTechnologyAsync(int technologyId) =>
        technologyRepository.DeleteTechnologyByAllInfoAsync(new Technology { Id = technologyId });

    private async Task<List<string>> ValidateAsync(string? name, int? excludeId)
    {
        var errors = NameRules.Validate(name);
        if (errors.Count == 0)
        {
            var existing = await technologyRepository.GetTechnologyByAllInfoAsync(name!.Trim());
            if (existing.Any(t => t.Id != excludeId))
            {
                errors.Add("A technology with this name already exists.");
            }
        }

        return errors;
    }
}
