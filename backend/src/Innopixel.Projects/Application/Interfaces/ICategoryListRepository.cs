namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Relationen PROJECTS <-> CATEGORY. Et projekt har højst én primær kategori.
public interface ICategoryListRepository
{
    Task<OperationResult> CreateCategoryListAsync(CategoryList categoryListInfo);

    Task<IReadOnlyList<CategoryList>> GetCategoryListByFullAsync(int projectId, int categoryId, bool isPrimary);
    Task<IReadOnlyList<CategoryList>> GetCategoryListByCategoryIdAsync(int categoryId);
    Task<IReadOnlyList<CategoryList>> GetCategoryListByProjectIdAsync(int projectId);
    Task<IReadOnlyList<CategoryList>> GetCategoryListByIsPrimaryAsync(int projectId, bool isPrimary);

    // Sættes isPrimary til true, mister projektets andre kategorier deres primær-markering.
    Task<OperationResult> UpdateCategoryListByIsPrimaryAsync(int projectId, int categoryId, bool isPrimary);

    // Erstatter alle projektets kategorier med categories.
    Task<OperationResult> UpdateCategoryListByCategoriesAsync(int projectId, IReadOnlyList<CategoryList> categories);

    Task<OperationResult> DeleteCategoryListByAllAsync(int projectId, int categoryId);
}
