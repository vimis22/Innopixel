namespace Innopixel.Pages.Infrastructure;

using Innopixel.Pages.Application.Interfaces;
using Innopixel.Pages.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class PageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IPageRepository
{
    public Task<int?> CreatePageAsync(Page pageInfo) =>
        InsertReturningIdAsync(
            """
            INSERT INTO page (slug, languagetype, title, content, seotitle, metadescription, is_published, is_indexable, updated_at)
            VALUES (@Slug, @LanguageType, @Title, @Content, @SeoTitle, @MetaDescription, @IsPublished, @IsIndexable, now())
            RETURNING id
            """,
            pageInfo);

    public Task<Page?> GetPageByIdAsync(int pageId) =>
        QuerySingleAsync<Page>("SELECT * FROM page WHERE id = @PageId", new { PageId = pageId });

    public Task<Page?> GetPageBySlugAsync(string slug, string languageType) =>
        QuerySingleAsync<Page>(
            "SELECT * FROM page WHERE slug = @Slug AND languagetype = @LanguageType",
            new { Slug = slug, LanguageType = languageType });

    public Task<IReadOnlyList<Page>> GetAllPagesAsync() =>
        QueryAsync<Page>("SELECT * FROM page ORDER BY slug, languagetype");

    public Task<IReadOnlyList<Page>> GetIndexablePagesAsync() =>
        QueryAsync<Page>("SELECT * FROM page WHERE is_published AND is_indexable ORDER BY slug, languagetype");

    public Task<OperationResult> UpdatePageByFullAsync(Page page) =>
        ExecuteAsync(
            """
            UPDATE page
            SET slug = @Slug, languagetype = @LanguageType, title = @Title, content = @Content,
                seotitle = @SeoTitle, metadescription = @MetaDescription,
                is_published = @IsPublished, is_indexable = @IsIndexable, updated_at = now()
            WHERE id = @Id
            """,
            page);

    public Task<OperationResult> UpdatePageBySeoAsync(Page page, string? seoTitle, string? metaDescription) =>
        ExecuteAsync(
            "UPDATE page SET seotitle = @SeoTitle, metadescription = @MetaDescription, updated_at = now() WHERE id = @Id",
            new { page.Id, SeoTitle = seoTitle, MetaDescription = metaDescription });

    public Task<OperationResult> UpdatePageByPublishedAsync(Page page, bool isPublished) =>
        ExecuteAsync(
            "UPDATE page SET is_published = @IsPublished, updated_at = now() WHERE id = @Id",
            new { page.Id, IsPublished = isPublished });

    public Task<OperationResult> DeletePageAsync(Page page) =>
        ExecuteAsync("DELETE FROM page WHERE id = @Id", new { page.Id });
}
