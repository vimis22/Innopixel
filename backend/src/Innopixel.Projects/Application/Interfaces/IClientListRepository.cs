namespace Innopixel.Projects.Application.Interfaces;

using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;

// Relationen CLIENT <-> PROJECTS.
public interface IClientListRepository
{
    Task<OperationResult> CreateClientListAsync(ClientList clientListInfo);

    Task<IReadOnlyList<ClientList>> GetClientListByFullAsync(int clientId, int projectId);
    Task<IReadOnlyList<ClientList>> GetClientListByClientIdAsync(int clientId);
    Task<IReadOnlyList<ClientList>> GetClientListByProjectIdAsync(int projectId);

    // Erstatter alle projektets kunder med clientIds.
    Task<OperationResult> UpdateClientListByClientsAsync(int projectId, IReadOnlyList<int> clientIds);

    Task<OperationResult> DeleteClientListByAllAsync(int clientId, int projectId);
}
