namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface ICategoryRepository
{
    Task<OperationResult> CreateCategoryAsync(Category categoryInfo);

    Task<IReadOnlyList<Category>> GetCategoryByIdAsync(int categoryId);
    Task<IReadOnlyList<Category>> GetCategoryByAllInfoAsync(string name);
    Task<IReadOnlyList<Category>> GetAllCategoriesAsync();
    Task<IReadOnlyList<Category>> GetCategoriesByProjectsIdAsync(int projectsId);

    Task<OperationResult> UpdateCategoryByFullAsync(Category category, string name);

    Task<OperationResult> DeleteCategoryByAllInfoAsync(Category category);
}
