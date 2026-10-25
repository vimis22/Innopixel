namespace Innopixel.Projects.Infrastructure;

using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class LanguagesRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ILanguagesRepository
{
    private const string SelectLanguages = "SELECT * FROM languages WHERE ";
    private const string InsertLanguages =
        "INSERT INTO languages (description, languagetype, text) VALUES (@Description, @LanguageType, @Text) RETURNING id";

    public Task<OperationResult> CreateLanguagesAsync(Languages languagesInfo) =>
        ExecuteAsync(InsertLanguages, languagesInfo);

    public Task<OperationResult> CreateLanguagesForServicesAsync(int servicesId, Languages languagesInfo) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            var languagesId = await connection.ExecuteScalarAsync<int>(InsertLanguages, languagesInfo, transaction);

            await connection.ExecuteAsync(
                "INSERT INTO languagelist (services_id, languages_id) VALUES (@ServicesId, @LanguagesId)",
                new { ServicesId = servicesId, LanguagesId = languagesId },
                transaction);
        });

    public Task<IReadOnlyList<Languages>> GetLanguagesByIdAsync(int languagesId) =>
        QueryAsync<Languages>(SelectLanguages + "id = @LanguagesId", new { LanguagesId = languagesId });

    public Task<IReadOnlyList<Languages>> GetLanguagesByAllInfoAsync(string? description, string languageType, string text) =>
        QueryAsync<Languages>(
            SelectLanguages + "description IS NOT DISTINCT FROM @Description AND languagetype = @LanguageType AND text = @Text",
            new { Description = description, LanguageType = languageType, Text = text });

    public Task<IReadOnlyList<Languages>> GetLanguagesByDescriptionAsync(string description) =>
        QueryAsync<Languages>(SelectLanguages + "description = @Description", new { Description = description });

    public Task<IReadOnlyList<Languages>> GetLanguagesByLanguageTypeAsync(string languageType) =>
        QueryAsync<Languages>(SelectLanguages + "languagetype = @LanguageType", new { LanguageType = languageType });

    public Task<IReadOnlyList<Languages>> GetLanguagesByTextAsync(string text) =>
        QueryAsync<Languages>(SelectLanguages + "text = @Text", new { Text = text });

    public Task<IReadOnlyList<Languages>> GetLanguagesByServicesIdAsync(int servicesId, string? languageType) =>
        QueryAsync<Languages>(
            """
            SELECT l.*
            FROM languages l
            JOIN languagelist ll ON ll.languages_id = l.id
            WHERE ll.services_id = @ServicesId AND (@LanguageType IS NULL OR l.languagetype = @LanguageType)
            ORDER BY l.id
            """,
            new { ServicesId = servicesId, LanguageType = languageType });

    public Task<OperationResult> UpdateLanguagesByFullAsync(Languages languages, string? description, string languageType, string text) =>
        ExecuteAsync(
            "UPDATE languages SET description = @Description, languagetype = @LanguageType, text = @Text WHERE id = @Id",
            new { languages.Id, Description = description, LanguageType = languageType, Text = text });

    public Task<OperationResult> UpdateLanguagesByDescriptionAsync(Languages languages, string? description) =>
        ExecuteAsync("UPDATE languages SET description = @Description WHERE id = @Id", new { languages.Id, Description = description });

    public Task<OperationResult> UpdateLanguagesByLanguageTypeAsync(Languages languages, string languageType) =>
        ExecuteAsync("UPDATE languages SET languagetype = @LanguageType WHERE id = @Id", new { languages.Id, LanguageType = languageType });

    public Task<OperationResult> UpdateLanguagesByTextAsync(Languages languages, string text) =>
        ExecuteAsync("UPDATE languages SET text = @Text WHERE id = @Id", new { languages.Id, Text = text });

    // Fjerner også tekstens koblinger til services.
    public Task<OperationResult> DeleteLanguagesByAllInfoAsync(Languages languages) =>
        ExecuteAsync(
            """
            WITH links AS (DELETE FROM languagelist WHERE languages_id = @Id)
            DELETE FROM languages WHERE id = @Id
            """,
            new { languages.Id });
}
