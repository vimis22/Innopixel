namespace Innopixel.Pages.Application;

using System.Text.RegularExpressions;
using Innopixel.Pages.Application.Interfaces;
using Innopixel.Pages.Contracts;
using Innopixel.Pages.Domain;
using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;

public partial class PagesService(IPageRepository pageRepository) : IPagesService
{
    public const int MaxSlugLength = 200;
    public const int MaxTitleLength = 200;
    public const int MaxContentLength = 100000;

    // Anbefalede grænser, så søgemaskiner viser teksten uden at afkorte den.
    public const int MaxSeoTitleLength = 70;
    public const int MaxMetaDescriptionLength = 160;

    public static readonly string[] SupportedLanguages = ["da", "en"];

    public async Task<Page?> GetPublishedPageAsync(string slug, string languageType)
    {
        var page = await pageRepository.GetPageBySlugAsync(slug, languageType);
        return page is { IsPublished: true } ? page : null;
    }

    public Task<IReadOnlyList<Page>> GetIndexablePagesAsync() =>
        pageRepository.GetIndexablePagesAsync();

    public Task<IReadOnlyList<Page>> GetAllPagesAsync() =>
        pageRepository.GetAllPagesAsync();

    public Task<Page?> GetPageByIdAsync(int pageId) =>
        pageRepository.GetPageByIdAsync(pageId);

    public async Task<ValidatedResult> CreatePageAsync(Page page)
    {
        var normalized = Normalize(page);
        var errors = await ValidateAsync(normalized);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        var id = await pageRepository.CreatePageAsync(normalized);
        return id is null ? ValidatedResult.From(OperationResult.Failed) : ValidatedResult.Success(id);
    }

    public async Task<ValidatedResult> UpdatePageAsync(Page page)
    {
        var normalized = Normalize(page);
        var errors = await ValidateAsync(normalized);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await pageRepository.UpdatePageByFullAsync(normalized));
    }

    public async Task<ValidatedResult> UpdateSeoAsync(int pageId, string? seoTitle, string? metaDescription)
    {
        var errors = new List<string>();
        ValidateSeo(errors, seoTitle, metaDescription);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await pageRepository.UpdatePageBySeoAsync(
                new Page { Id = pageId }, NullIfBlank(seoTitle), NullIfBlank(metaDescription)));
    }

    public Task<OperationResult> SetPublishedAsync(int pageId, bool isPublished) =>
        pageRepository.UpdatePageByPublishedAsync(new Page { Id = pageId }, isPublished);

    public Task<OperationResult> DeletePageAsync(int pageId) =>
        pageRepository.DeletePageAsync(new Page { Id = pageId });

    internal static List<string> Validate(Page page)
    {
        var errors = new List<string>();

        Validator.Required(errors, page.Slug, "Slug", MaxSlugLength);
        if (!string.IsNullOrEmpty(page.Slug) && !SlugPattern().IsMatch(page.Slug))
        {
            errors.Add("Slug may only contain lowercase letters, digits, '-' and '/' (e.g. 'about' or 'services/web').");
        }

        if (!SupportedLanguages.Contains(page.LanguageType))
        {
            errors.Add($"Language must be one of: {string.Join(", ", SupportedLanguages)}.");
        }

        Validator.Required(errors, page.Title, "Title", MaxTitleLength);
        Validator.Optional(errors, page.Content, "Content", MaxContentLength);
        ValidateSeo(errors, page.SeoTitle, page.MetaDescription);

        return errors;
    }

    private async Task<List<string>> ValidateAsync(Page page)
    {
        var errors = Validate(page);
        if (errors.Count == 0)
        {
            var existing = await pageRepository.GetPageBySlugAsync(page.Slug, page.LanguageType);
            if (existing is not null && existing.Id != page.Id)
            {
                errors.Add("A page with this slug already exists for this language.");
            }
        }

        return errors;
    }

    private static void ValidateSeo(List<string> errors, string? seoTitle, string? metaDescription)
    {
        Validator.Optional(errors, seoTitle, "SEO title", MaxSeoTitleLength);
        Validator.Optional(errors, metaDescription, "Meta description", MaxMetaDescriptionLength);
    }

    private static Page Normalize(Page page) => new()
    {
        Id = page.Id,
        Slug = page.Slug?.Trim().Trim('/').ToLowerInvariant() ?? string.Empty,
        LanguageType = page.LanguageType?.Trim().ToLowerInvariant() ?? string.Empty,
        Title = page.Title?.Trim() ?? string.Empty,
        Content = page.Content,
        SeoTitle = NullIfBlank(page.SeoTitle),
        MetaDescription = NullIfBlank(page.MetaDescription),
        IsPublished = page.IsPublished,
        IsIndexable = page.IsIndexable
    };

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$")]
    private static partial Regex SlugPattern();
}
