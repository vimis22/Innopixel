namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class ServiceListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IServiceListRepository
{
    private const string SelectServiceList = "SELECT * FROM servicelist WHERE ";

    public Task<OperationResult> CreateServiceListAsync(ServiceList serviceListInfo) =>
        ExecuteAsync(
            "INSERT INTO servicelist (rights_id, services_id) VALUES (@RightsId, @ServicesId)",
            serviceListInfo);

    public Task<IReadOnlyList<ServiceList>> GetServiceListByFullAsync(int rightsId, int serviceId) =>
        QueryAsync<ServiceList>(
            SelectServiceList + "rights_id = @RightsId AND services_id = @ServicesId",
            new { RightsId = rightsId, ServicesId = serviceId });

    public Task<IReadOnlyList<ServiceList>> GetServiceListByRightsIdAsync(int rightsId) =>
        QueryAsync<ServiceList>(SelectServiceList + "rights_id = @RightsId", new { RightsId = rightsId });

    public Task<IReadOnlyList<ServiceList>> GetServiceListByServiceIdAsync(int serviceId) =>
        QueryAsync<ServiceList>(SelectServiceList + "services_id = @ServicesId", new { ServicesId = serviceId });

    public Task<OperationResult> UpdateServiceListByRightsAsync(int serviceId, IReadOnlyList<int> rightsIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM servicelist WHERE services_id = @ServicesId",
                new { ServicesId = serviceId }, transaction);

            await connection.ExecuteAsync(
                "INSERT INTO servicelist (rights_id, services_id) VALUES (@RightsId, @ServicesId)",
                rightsIds.Distinct().Select(rightsId => new { RightsId = rightsId, ServicesId = serviceId }), transaction);
        });

    public Task<OperationResult> DeleteServiceListByAllAsync(int rightsId, int serviceId) =>
        ExecuteAsync(
            "DELETE FROM servicelist WHERE rights_id = @RightsId AND services_id = @ServicesId",
            new { RightsId = rightsId, ServicesId = serviceId });
}
