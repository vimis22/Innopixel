namespace Innopixel.Projects.Application;

using System.Text.Json;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Domain;

public class PublicContentService(IPublicContentRepository repository) : IPublicContentService
{
    public async Task<IReadOnlyList<PublicProjectDto>> GetProjectsAsync(string languageType)
    {
        var language = Normalize(languageType);
        var projects = await repository.GetPublishedProjectsAsync();
        var texts = await repository.GetProjectTextsAsync();
        var technologies = await repository.GetProjectTechnologiesAsync();

        return projects
            .Select(p =>
            {
                var text = Texts(texts, p.Id, language);
                return new PublicProjectDto(
                    p.Id.ToString(),
                    text("title") ?? p.Name,
                    ParseTags(text("tags")),
                    text("intro") ?? p.Description ?? string.Empty,
                    text("body") ?? string.Empty,
                    p.ImageUrl,
                    p.Client ?? string.Empty,
                    string.Join(", ", technologies.Where(t => t.ProjectsId == p.Id).Select(t => t.Name)));
            })
            .ToList();
    }

    public async Task<IReadOnlyList<PublicServiceDto>> GetServicesAsync(string languageType)
    {
        var language = Normalize(languageType);
        var services = await repository.GetServicesAsync();
        var texts = await repository.GetServiceTextsAsync();

        return services
            .Select(s =>
            {
                var text = Texts(texts, s.Id, language);
                return new PublicServiceDto(
                    s.Id.ToString(), s.Iconidentifier ?? string.Empty, text("title") ?? s.Projectdescription,
                    text("description") ?? s.Projectdescription);
            })
            .ToList();
    }

    // Ukendt sprog -> dansk.
    internal static string Normalize(string? languageType) =>
        LanguageTypes.IsValid(languageType?.ToLowerInvariant()) ? languageType!.ToLowerInvariant() : LanguageTypes.Danish;

    // Teksten på det ønskede sprog, ellers på dansk, ellers null.
    internal static Func<string, string?> Texts(IReadOnlyList<TextRow> texts, int ownerId, string language) =>
        key => Pick(texts, ownerId, key, language) ?? Pick(texts, ownerId, key, LanguageTypes.Danish);

    private static string? Pick(IReadOnlyList<TextRow> texts, int ownerId, string key, string language) =>
        texts.FirstOrDefault(t => t.OwnerId == ownerId && t.Description == key && t.Languagetype == language)?.Text;

    // Tags gemmes som et JSON-array, f.eks. ["Augmented Reality","EduTech"].
    internal static IReadOnlyList<string> ParseTags(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<string[]>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
