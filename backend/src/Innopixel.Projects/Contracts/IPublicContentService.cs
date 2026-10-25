namespace Innopixel.Projects.Contracts;

// Det, hjemmesiden viser. Felterne svarer til frontend/src/types/project.ts og types/service.ts.
public record PublicProjectDto(
    string Id,
    string Title,
    IReadOnlyList<string> Tags,
    string Intro,
    string Body,
    string? Image,
    string Client,
    string Tech);

// Icon er servicens iconidentifier (f.eks. "vr"), som frontenden oversætter til et ikon.
public record PublicServiceDto(string Id, string Icon, string Title, string Description);

// Indhold til den offentlige hjemmeside (US-05, US-06, US-07, US-18). Kun publicerede projekter.
public interface IPublicContentService
{
    Task<IReadOnlyList<PublicProjectDto>> GetProjectsAsync(string languageType);
    Task<IReadOnlyList<PublicServiceDto>> GetServicesAsync(string languageType);
}
