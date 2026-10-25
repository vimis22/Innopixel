namespace Innopixel.ChatbotInterpreter.Application;

using System.Text;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Domain;

// Den viden, chatbotten må svare ud fra: services og publicerede projekter. Kladder er aldrig med.
internal sealed record CompanyContext(IReadOnlyList<string> Services, IReadOnlyList<(string Name, string? Description)> Projects)
{
    public const int MaxProjects = 20;
    public const int MaxDescriptionLength = 300;

    public static async Task<CompanyContext> LoadAsync(
        IServicesService servicesService,
        IProjectsService projectsService,
        string languageType)
    {
        var services = await servicesService.GetServicesAsync();

        var serviceTexts = services
            .Select(s =>
            {
                // Foretræk tekster på den besøgendes sprog, ellers servicens beskrivelse.
                var texts = s.Texts.Where(t => t.LanguageType == languageType).Select(t => t.Text).ToList();
                return texts.Count > 0 ? string.Join(" ", texts) : s.Service.ProjectDescription;
            })
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .ToList();

        var projects = (await projectsService.GetPublishedProjectsAsync())
            .Take(MaxProjects)
            .Select(p => (p.Name, Shorten(p.Description)))
            .ToList();

        return new CompanyContext(serviceTexts, projects);
    }

    public string ToPromptText()
    {
        var builder = new StringBuilder();

        builder.AppendLine("Services:");
        foreach (var service in Services)
        {
            builder.AppendLine($"- {service}");
        }

        builder.AppendLine();
        builder.AppendLine("Previous projects:");
        foreach (var (name, description) in Projects)
        {
            builder.AppendLine(description is null ? $"- {name}" : $"- {name}: {description}");
        }

        return builder.ToString();
    }

    private static string? Shorten(string? text) =>
        text is null || text.Length <= MaxDescriptionLength ? text : text[..MaxDescriptionLength].TrimEnd() + "…";
}
