namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class CategoryRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ICategoryRepository
{
    public Task<OperationResult> CreateCategoryAsync(Category categoryInfo) =>
        ExecuteAsync("INSERT INTO category (name) VALUES (@Name)", categoryInfo);

    public Task<IReadOnlyList<Category>> GetCategoryByIdAsync(int categoryId) =>
        QueryAsync<Category>("SELECT * FROM category WHERE id = @CategoryId", new { CategoryId = categoryId });

    public Task<IReadOnlyList<Category>> GetCategoryByAllInfoAsync(string name) =>
        QueryAsync<Category>("SELECT * FROM category WHERE name = @Name", new { Name = name });

    public Task<IReadOnlyList<Category>> GetAllCategoriesAsync() =>
        QueryAsync<Category>("SELECT * FROM category ORDER BY name");

    public Task<IReadOnlyList<Category>> GetCategoriesByProjectsIdAsync(int projectsId) =>
        QueryAsync<Category>(
            """
            SELECT c.*
            FROM category c
            JOIN categorylist cl ON cl.category_id = c.id
            WHERE cl.projects_id = @ProjectsId
            ORDER BY cl.is_primary DESC, c.name
            """,
            new { ProjectsId = projectsId });

    public Task<OperationResult> UpdateCategoryByFullAsync(Category category, string name) =>
        ExecuteAsync("UPDATE category SET name = @Name WHERE id = @Id", new { category.Id, Name = name });

    // Fjerner også kategoriens koblinger til projekter.
    public Task<OperationResult> DeleteCategoryByAllInfoAsync(Category category) =>
        ExecuteAsync(
            """
            WITH links AS (DELETE FROM categorylist WHERE category_id = @Id)
            DELETE FROM category WHERE id = @Id
            """,
            new { category.Id });
}
