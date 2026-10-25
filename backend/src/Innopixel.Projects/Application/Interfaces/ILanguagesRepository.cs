namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

public interface ILanguagesRepository
{
    Task<OperationResult> CreateLanguagesAsync(Languages languagesInfo);

    // Opretter teksten og kobler den til servicen via LANGUAGELIST i én transaktion.
    Task<OperationResult> CreateLanguagesForServicesAsync(int servicesId, Languages languagesInfo);

    Task<IReadOnlyList<Languages>> GetLanguagesByIdAsync(int languagesId);
    Task<IReadOnlyList<Languages>> GetLanguagesByAllInfoAsync(string? description, string languageType, string text);
    Task<IReadOnlyList<Languages>> GetLanguagesByDescriptionAsync(string description);
    Task<IReadOnlyList<Languages>> GetLanguagesByLanguageTypeAsync(string languageType);
    Task<IReadOnlyList<Languages>> GetLanguagesByTextAsync(string text);

    // Tekster koblet til en service via LANGUAGELIST. languageType null = alle sprog.
    Task<IReadOnlyList<Languages>> GetLanguagesByServicesIdAsync(int servicesId, string? languageType);

    Task<OperationResult> UpdateLanguagesByFullAsync(Languages languages, string? description, string languageType, string text);
    Task<OperationResult> UpdateLanguagesByDescriptionAsync(Languages languages, string? description);
    Task<OperationResult> UpdateLanguagesByLanguageTypeAsync(Languages languages, string languageType);
    Task<OperationResult> UpdateLanguagesByTextAsync(Languages languages, string text);

    Task<OperationResult> DeleteLanguagesByAllInfoAsync(Languages languages);
}
