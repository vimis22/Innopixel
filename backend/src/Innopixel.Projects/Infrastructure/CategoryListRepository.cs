namespace Innopixel.Projects.Infrastructure;

using System.Data;
using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class CategoryListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ICategoryListRepository
{
    private const string SelectCategoryList = "SELECT * FROM categorylist WHERE ";
    private const string InsertCategoryList =
        "INSERT INTO categorylist (is_primary, projects_id, category_id) VALUES (@IsPrimary, @ProjectsId, @CategoryId)";

    public Task<OperationResult> CreateCategoryListAsync(CategoryList categoryListInfo) =>
        categoryListInfo.IsPrimary
            ? InTransactionAsync(async (connection, transaction) =>
            {
                await ClearPrimaryAsync(connection, transaction, categoryListInfo.ProjectsId);
                await connection.ExecuteAsync(InsertCategoryList, categoryListInfo, transaction);
            })
            : ExecuteAsync(InsertCategoryList, categoryListInfo);

    public Task<IReadOnlyList<CategoryList>> GetCategoryListByFullAsync(int projectId, int categoryId, bool isPrimary) =>
        QueryAsync<CategoryList>(
            SelectCategoryList + "projects_id = @ProjectsId AND category_id = @CategoryId AND is_primary = @IsPrimary",
            new { ProjectsId = projectId, CategoryId = categoryId, IsPrimary = isPrimary });

    public Task<IReadOnlyList<CategoryList>> GetCategoryListByCategoryIdAsync(int categoryId) =>
        QueryAsync<CategoryList>(SelectCategoryList + "category_id = @CategoryId", new { CategoryId = categoryId });

    public Task<IReadOnlyList<CategoryList>> GetCategoryListByProjectIdAsync(int projectId) =>
        QueryAsync<CategoryList>(SelectCategoryList + "projects_id = @ProjectsId", new { ProjectsId = projectId });

    public Task<IReadOnlyList<CategoryList>> GetCategoryListByIsPrimaryAsync(int projectId, bool isPrimary) =>
        QueryAsync<CategoryList>(
            SelectCategoryList + "projects_id = @ProjectsId AND is_primary = @IsPrimary",
            new { ProjectsId = projectId, IsPrimary = isPrimary });

    public Task<OperationResult> UpdateCategoryListByIsPrimaryAsync(int projectId, int categoryId, bool isPrimary) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            if (isPrimary)
            {
                await ClearPrimaryAsync(connection, transaction, projectId);
            }

            var affected = await connection.ExecuteAsync(
                "UPDATE categorylist SET is_primary = @IsPrimary WHERE projects_id = @ProjectsId AND category_id = @CategoryId",
                new { ProjectsId = projectId, CategoryId = categoryId, IsPrimary = isPrimary },
                transaction);

            // Findes koblingen ikke, rulles nulstillingen af de andre kategorier også tilbage.
            return affected > 0 ? OperationResult.Success : OperationResult.NotFound;
        });

    public Task<OperationResult> UpdateCategoryListByCategoriesAsync(int projectId, IReadOnlyList<CategoryList> categories)
    {
        // Samme kategori må kun optræde én gang, og kun den første primære beholdes som primær.
        var primaryId = categories.FirstOrDefault(c => c.IsPrimary)?.CategoryId;
        var rows = categories
            .Select(c => c.CategoryId)
            .Distinct()
            .Select(categoryId => new { IsPrimary = categoryId == primaryId, ProjectsId = projectId, CategoryId = categoryId });

        return InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM categorylist WHERE projects_id = @ProjectsId",
                new { ProjectsId = projectId }, transaction);

            await connection.ExecuteAsync(InsertCategoryList, rows, transaction);
        });
    }

    public Task<OperationResult> DeleteCategoryListByAllAsync(int projectId, int categoryId) =>
        ExecuteAsync(
            "DELETE FROM categorylist WHERE projects_id = @ProjectsId AND category_id = @CategoryId",
            new { ProjectsId = projectId, CategoryId = categoryId });

    private static Task ClearPrimaryAsync(IDbConnection connection, IDbTransaction transaction, int projectId) =>
        connection.ExecuteAsync(
            "UPDATE categorylist SET is_primary = false WHERE projects_id = @ProjectsId",
            new { ProjectsId = projectId }, transaction);
}
