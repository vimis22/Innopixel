namespace Innopixel.Pages.Contracts;

using Innopixel.Pages.Domain;
using Innopixel.Shared.Results;

// Offentlige sider og deres SEO (US-03, US-18, US-19).
public interface IPagesService
{
    // --- Offentlig hjemmeside ---

    // Kun publicerede sider. null, hvis siden ikke findes eller ikke er publiceret.
    Task<Page?> GetPublishedPageAsync(string slug, string languageType);

    // Sider, der må indekseres af søgemaskiner (til sitemap.xml).
    Task<IReadOnlyList<Page>> GetIndexablePagesAsync();

    // --- Administration ---
    Task<IReadOnlyList<Page>> GetAllPagesAsync();
    Task<Page?> GetPageByIdAsync(int pageId);

    // Id i resultatet er sidens id.
    Task<ValidatedResult> CreatePageAsync(Page page);
    Task<ValidatedResult> UpdatePageAsync(Page page);
    Task<ValidatedResult> UpdateSeoAsync(int pageId, string? seoTitle, string? metaDescription);
    Task<OperationResult> SetPublishedAsync(int pageId, bool isPublished);
    Task<OperationResult> DeletePageAsync(int pageId);
}
