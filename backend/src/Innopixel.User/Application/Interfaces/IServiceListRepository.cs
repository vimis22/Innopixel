namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen RIGHTS <-> SERVICES.
public interface IServiceListRepository
{
    Task<OperationResult> CreateServiceListAsync(ServiceList serviceListInfo);

    Task<IReadOnlyList<ServiceList>> GetServiceListByFullAsync(int rightsId, int serviceId);
    Task<IReadOnlyList<ServiceList>> GetServiceListByRightsIdAsync(int rightsId);
    Task<IReadOnlyList<ServiceList>> GetServiceListByServiceIdAsync(int serviceId);

    // Erstatter alle rettigheder for servicen med rightsIds.
    Task<OperationResult> UpdateServiceListByRightsAsync(int serviceId, IReadOnlyList<int> rightsIds);

    Task<OperationResult> DeleteServiceListByAllAsync(int rightsId, int serviceId);
}
