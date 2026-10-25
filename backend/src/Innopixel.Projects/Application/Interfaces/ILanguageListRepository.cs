namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Relationen SERVICES <-> LANGUAGES.
public interface ILanguageListRepository
{
    Task<OperationResult> CreateLanguageListAsync(LanguageList languageListInfo);

    Task<IReadOnlyList<LanguageList>> GetLanguageListByFullAsync(int serviceId, int languageId);
    Task<IReadOnlyList<LanguageList>> GetLanguageListByServiceIdAsync(int serviceId);
    Task<IReadOnlyList<LanguageList>> GetLanguageListByLanguageIdAsync(int languageId);
    Task<IReadOnlyList<LanguageList>> GetLanguageListByLanguageTypeAsync(int serviceId, string languageType);

    // Erstatter alle servicens tekster med languageIds.
    Task<OperationResult> UpdateLanguageListByLanguagesAsync(int serviceId, IReadOnlyList<int> languageIds);

    Task<OperationResult> DeleteLanguageListByAllAsync(int serviceId, int languageId);
}
