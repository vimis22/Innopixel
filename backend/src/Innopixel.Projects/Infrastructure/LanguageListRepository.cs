namespace Innopixel.Projects.Infrastructure;

using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class LanguageListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ILanguageListRepository
{
    private const string SelectLanguageList = "SELECT * FROM languagelist WHERE ";
    private const string InsertLanguageList = "INSERT INTO languagelist (services_id, languages_id) VALUES (@ServicesId, @LanguagesId)";

    public Task<OperationResult> CreateLanguageListAsync(LanguageList languageListInfo) =>
        ExecuteAsync(InsertLanguageList, languageListInfo);

    public Task<IReadOnlyList<LanguageList>> GetLanguageListByFullAsync(int serviceId, int languageId) =>
        QueryAsync<LanguageList>(
            SelectLanguageList + "services_id = @ServicesId AND languages_id = @LanguagesId",
            new { ServicesId = serviceId, LanguagesId = languageId });

    public Task<IReadOnlyList<LanguageList>> GetLanguageListByServiceIdAsync(int serviceId) =>
        QueryAsync<LanguageList>(SelectLanguageList + "services_id = @ServicesId", new { ServicesId = serviceId });

    public Task<IReadOnlyList<LanguageList>> GetLanguageListByLanguageIdAsync(int languageId) =>
        QueryAsync<LanguageList>(SelectLanguageList + "languages_id = @LanguagesId", new { LanguagesId = languageId });

    public Task<IReadOnlyList<LanguageList>> GetLanguageListByLanguageTypeAsync(int serviceId, string languageType) =>
        QueryAsync<LanguageList>(
            """
            SELECT ll.*
            FROM languagelist ll
            JOIN languages l ON l.id = ll.languages_id
            WHERE ll.services_id = @ServicesId AND l.languagetype = @LanguageType
            """,
            new { ServicesId = serviceId, LanguageType = languageType });

    public Task<OperationResult> UpdateLanguageListByLanguagesAsync(int serviceId, IReadOnlyList<int> languageIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM languagelist WHERE services_id = @ServicesId",
                new { ServicesId = serviceId }, transaction);

            await connection.ExecuteAsync(
                InsertLanguageList,
                languageIds.Distinct().Select(languageId => new { ServicesId = serviceId, LanguagesId = languageId }),
                transaction);
        });

    public Task<OperationResult> DeleteLanguageListByAllAsync(int serviceId, int languageId) =>
        ExecuteAsync(
            "DELETE FROM languagelist WHERE services_id = @ServicesId AND languages_id = @LanguagesId",
            new { ServicesId = serviceId, LanguagesId = languageId });
}
