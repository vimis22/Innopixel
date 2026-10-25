namespace Innopixel.Projects.Contracts;

using Innopixel.Projects.Contracts.Dtos;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Services og deres tekster på flere sprog (US-05, US-13, US-18).
public interface IServicesService
{
    // languageType null = tekster på alle sprog.
    Task<IReadOnlyList<ServiceDetails>> GetServicesAsync(string? languageType = null);
    Task<ServiceDetails?> GetServiceAsync(int serviceId, string? languageType = null);

    // Id i resultatet er servicens id.
    Task<ValidatedResult> CreateServiceAsync(Services service);
    Task<ValidatedResult> UpdateServiceAsync(Services service);
    Task<OperationResult> DeleteServiceAsync(int serviceId);

    Task<ValidatedResult> AddServiceTextAsync(int serviceId, Languages text);
    Task<ValidatedResult> UpdateTextAsync(Languages text);
    Task<OperationResult> DeleteTextAsync(int languagesId);
}
