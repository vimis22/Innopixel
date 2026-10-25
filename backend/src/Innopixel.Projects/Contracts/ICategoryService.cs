namespace Innopixel.Projects.Contracts;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Kategorier, som projekter kan placeres i (US-15).
public interface ICategoryService
{
    Task<IReadOnlyList<Category>> GetAllCategoriesAsync();
    Task<ValidatedResult> CreateCategoryAsync(string name);
    Task<ValidatedResult> RenameCategoryAsync(int categoryId, string name);
    Task<OperationResult> DeleteCategoryAsync(int categoryId);
}
