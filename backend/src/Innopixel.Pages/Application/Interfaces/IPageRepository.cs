namespace Innopixel.Pages.Application.Interfaces;

using Innopixel.Pages.Domain;
using Innopixel.Shared.Results;

public interface IPageRepository
{
    // Returnerer det nye id, eller null hvis databasen afviser siden (f.eks. slug findes allerede).
    Task<int?> CreatePageAsync(Page pageInfo);

    Task<Page?> GetPageByIdAsync(int pageId);
    Task<Page?> GetPageBySlugAsync(string slug, string languageType);
    Task<IReadOnlyList<Page>> GetAllPagesAsync();
    Task<IReadOnlyList<Page>> GetIndexablePagesAsync();

    Task<OperationResult> UpdatePageByFullAsync(Page page);
    Task<OperationResult> UpdatePageBySeoAsync(Page page, string? seoTitle, string? metaDescription);
    Task<OperationResult> UpdatePageByPublishedAsync(Page page, bool isPublished);

    Task<OperationResult> DeletePageAsync(Page page);
}
