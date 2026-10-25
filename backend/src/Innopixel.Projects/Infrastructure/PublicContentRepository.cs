namespace Innopixel.Projects.Infrastructure;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Shared.Data;

public class PublicContentRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IPublicContentRepository
{
    private const string Published = "currentstatus = 'Published' AND archived = false";

    public Task<IReadOnlyList<PublishedProjectRow>> GetPublishedProjectsAsync() =>
        QueryAsync<PublishedProjectRow>($"SELECT id, name, description, client, image_url FROM projects WHERE {Published} ORDER BY id");

    public Task<IReadOnlyList<TextRow>> GetProjectTextsAsync() =>
        QueryAsync<TextRow>(
            $"""
            SELECT pl.projects_id AS owner_id, l.description, l.languagetype, l.text
            FROM projectlanguagelist pl
            JOIN languages l ON l.id = pl.languages_id
            WHERE pl.projects_id IN (SELECT id FROM projects WHERE {Published})
            """);

    public Task<IReadOnlyList<TechnologyRow>> GetProjectTechnologiesAsync() =>
        QueryAsync<TechnologyRow>(
            $"""
            SELECT tl.projects_id, t.name
            FROM technologylist tl
            JOIN technology t ON t.id = tl.technology_id
            WHERE tl.projects_id IN (SELECT id FROM projects WHERE {Published})
            ORDER BY tl.id
            """);

    public Task<IReadOnlyList<ServiceRow>> GetServicesAsync() =>
        QueryAsync<ServiceRow>("SELECT id, projectdescription, iconidentifier FROM services ORDER BY id");

    public Task<IReadOnlyList<TextRow>> GetServiceTextsAsync() =>
        QueryAsync<TextRow>(
            """
            SELECT ll.services_id AS owner_id, l.description, l.languagetype, l.text
            FROM languagelist ll
            JOIN languages l ON l.id = ll.languages_id
            """);
}
