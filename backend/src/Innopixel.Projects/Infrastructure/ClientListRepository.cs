namespace Innopixel.Projects.Infrastructure;

using Dapper;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ClientListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IClientListRepository
{
    private const string SelectClientList = "SELECT * FROM clientlist WHERE ";
    private const string InsertClientList = "INSERT INTO clientlist (client_id, projects_id) VALUES (@ClientId, @ProjectsId)";

    public Task<OperationResult> CreateClientListAsync(ClientList clientListInfo) =>
        ExecuteAsync(InsertClientList, clientListInfo);

    public Task<IReadOnlyList<ClientList>> GetClientListByFullAsync(int clientId, int projectId) =>
        QueryAsync<ClientList>(
            SelectClientList + "client_id = @ClientId AND projects_id = @ProjectsId",
            new { ClientId = clientId, ProjectsId = projectId });

    public Task<IReadOnlyList<ClientList>> GetClientListByClientIdAsync(int clientId) =>
        QueryAsync<ClientList>(SelectClientList + "client_id = @ClientId", new { ClientId = clientId });

    public Task<IReadOnlyList<ClientList>> GetClientListByProjectIdAsync(int projectId) =>
        QueryAsync<ClientList>(SelectClientList + "projects_id = @ProjectsId", new { ProjectsId = projectId });

    public Task<OperationResult> UpdateClientListByClientsAsync(int projectId, IReadOnlyList<int> clientIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM clientlist WHERE projects_id = @ProjectsId",
                new { ProjectsId = projectId }, transaction);

            await connection.ExecuteAsync(
                InsertClientList,
                clientIds.Distinct().Select(clientId => new { ClientId = clientId, ProjectsId = projectId }),
                transaction);
        });

    public Task<OperationResult> DeleteClientListByAllAsync(int clientId, int projectId) =>
        ExecuteAsync(
            "DELETE FROM clientlist WHERE client_id = @ClientId AND projects_id = @ProjectsId",
            new { ClientId = clientId, ProjectsId = projectId });
}
