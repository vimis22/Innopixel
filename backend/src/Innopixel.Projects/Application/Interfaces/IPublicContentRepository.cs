namespace Innopixel.Projects.Application.Interfaces;

public sealed record PublishedProjectRow(int Id, string Name, string? Description, string? Client, string? ImageUrl);

public sealed record ServiceRow(int Id, string Projectdescription, string? Iconidentifier);

// En tekst (description = hvilken tekst, f.eks. "title") til et projekt eller en service (OwnerId).
public sealed record TextRow(int OwnerId, string Description, string Languagetype, string Text);

public sealed record TechnologyRow(int ProjectsId, string Name);

public interface IPublicContentRepository
{
    Task<IReadOnlyList<PublishedProjectRow>> GetPublishedProjectsAsync();
    Task<IReadOnlyList<TextRow>> GetProjectTextsAsync();
    Task<IReadOnlyList<TechnologyRow>> GetProjectTechnologiesAsync();
    Task<IReadOnlyList<ServiceRow>> GetServicesAsync();
    Task<IReadOnlyList<TextRow>> GetServiceTextsAsync();
}
