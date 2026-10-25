namespace Innopixel.Projects.Application;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    public Task<IReadOnlyList<Category>> GetAllCategoriesAsync() =>
        categoryRepository.GetAllCategoriesAsync();

    public async Task<ValidatedResult> CreateCategoryAsync(string name)
    {
        var errors = await ValidateAsync(name, excludeId: null);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await categoryRepository.CreateCategoryAsync(new Category { Name = name.Trim() }));
    }

    public async Task<ValidatedResult> RenameCategoryAsync(int categoryId, string name)
    {
        var errors = await ValidateAsync(name, excludeId: categoryId);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await categoryRepository.UpdateCategoryByFullAsync(new Category { Id = categoryId }, name.Trim()));
    }

    public Task<OperationResult> DeleteCategoryAsync(int categoryId) =>
        categoryRepository.DeleteCategoryByAllInfoAsync(new Category { Id = categoryId });

    private async Task<List<string>> ValidateAsync(string? name, int? excludeId)
    {
        var errors = NameRules.Validate(name);
        if (errors.Count == 0)
        {
            var existing = await categoryRepository.GetCategoryByAllInfoAsync(name!.Trim());
            if (existing.Any(c => c.Id != excludeId))
            {
                errors.Add("A category with this name already exists.");
            }
        }

        return errors;
    }
}
