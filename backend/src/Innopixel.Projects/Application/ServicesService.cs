namespace Innopixel.Projects.Application;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Contracts.Dtos;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;

public class ServicesService(
    IServicesRepository servicesRepository,
    ILanguagesRepository languagesRepository) : IServicesService
{
    public const int MaxProjectDescriptionLength = 2000;
    public const int MaxIconIdentifierLength = 100;
    public const int MaxTextLength = 10000;
    public const int MaxTextDescriptionLength = 200;

    public async Task<IReadOnlyList<ServiceDetails>> GetServicesAsync(string? languageType = null)
    {
        var services = await servicesRepository.GetAllServicesAsync();
        var details = new List<ServiceDetails>(services.Count);

        foreach (var service in services)
        {
            details.Add(new ServiceDetails(service, await languagesRepository.GetLanguagesByServicesIdAsync(service.Id, languageType)));
        }

        return details;
    }

    public async Task<ServiceDetails?> GetServiceAsync(int serviceId, string? languageType = null)
    {
        var service = (await servicesRepository.GetServicesByIdAsync(serviceId)).FirstOrDefault();
        return service is null
            ? null
            : new ServiceDetails(service, await languagesRepository.GetLanguagesByServicesIdAsync(serviceId, languageType));
    }

    public async Task<ValidatedResult> CreateServiceAsync(Services service)
    {
        var errors = Validate(service);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        var id = await servicesRepository.CreateServicesAndGetIdAsync(Normalize(service));
        return id is null ? ValidatedResult.From(OperationResult.Failed) : ValidatedResult.Success(id);
    }

    public async Task<ValidatedResult> UpdateServiceAsync(Services service)
    {
        var errors = Validate(service);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        var normalized = Normalize(service);
        return ValidatedResult.From(await servicesRepository.UpdateServicesByFullAsync(
            normalized, normalized.ProjectDescription, normalized.IconIdentifier));
    }

    public Task<OperationResult> DeleteServiceAsync(int serviceId) =>
        servicesRepository.DeleteServicesByAllInfoAsync(new Services { Id = serviceId });

    public async Task<ValidatedResult> AddServiceTextAsync(int serviceId, Languages text)
    {
        var errors = ValidateText(text);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        if ((await servicesRepository.GetServicesByIdAsync(serviceId)).Count == 0)
        {
            return ValidatedResult.From(OperationResult.NotFound);
        }

        return ValidatedResult.From(await languagesRepository.CreateLanguagesForServicesAsync(serviceId, text));
    }

    public async Task<ValidatedResult> UpdateTextAsync(Languages text)
    {
        var errors = ValidateText(text);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        return ValidatedResult.From(await languagesRepository.UpdateLanguagesByFullAsync(
            text, text.Description, text.LanguageType, text.Text));
    }

    public Task<OperationResult> DeleteTextAsync(int languagesId) =>
        languagesRepository.DeleteLanguagesByAllInfoAsync(new Languages { Id = languagesId });

    internal static List<string> Validate(Services service)
    {
        var errors = new List<string>();
        Validator.Required(errors, service.ProjectDescription, "Description", MaxProjectDescriptionLength);
        Validator.Optional(errors, service.IconIdentifier, "Icon identifier", MaxIconIdentifierLength);
        return errors;
    }

    internal static List<string> ValidateText(Languages text)
    {
        var errors = new List<string>();
        if (!LanguageTypes.IsValid(text.LanguageType))
        {
            errors.Add($"Language must be '{LanguageTypes.Danish}' or '{LanguageTypes.English}'.");
        }

        Validator.Required(errors, text.Text, "Text", MaxTextLength);
        Validator.Optional(errors, text.Description, "Text description", MaxTextDescriptionLength);
        return errors;
    }

    private static Services Normalize(Services service) => new()
    {
        Id = service.Id,
        ProjectDescription = service.ProjectDescription.Trim(),
        IconIdentifier = string.IsNullOrWhiteSpace(service.IconIdentifier) ? null : service.IconIdentifier.Trim()
    };
}
