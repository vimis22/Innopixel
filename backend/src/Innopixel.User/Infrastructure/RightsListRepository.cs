namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class RightsListRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IRightsListRepository
{
    private const string SelectRightsList = "SELECT * FROM rightslist WHERE ";

    public Task<OperationResult> CreateRightsListAsync(RightsList rightsListInfo) =>
        ExecuteAsync(
            "INSERT INTO rightslist (admin_id, rights_id) VALUES (@AdminId, @RightsId)",
            rightsListInfo);

    public Task<IReadOnlyList<RightsList>> GetRightsListByFullAsync(int adminId, int rightsId) =>
        QueryAsync<RightsList>(
            SelectRightsList + "admin_id = @AdminId AND rights_id = @RightsId",
            new { AdminId = adminId, RightsId = rightsId });

    public Task<IReadOnlyList<RightsList>> GetRightsListByAdminIdAsync(int adminId) =>
        QueryAsync<RightsList>(SelectRightsList + "admin_id = @AdminId", new { AdminId = adminId });

    public Task<IReadOnlyList<RightsList>> GetRightsListByRightsIdAsync(int rightsId) =>
        QueryAsync<RightsList>(SelectRightsList + "rights_id = @RightsId", new { RightsId = rightsId });

    public Task<OperationResult> UpdateRightsListByRightsAsync(int adminId, IReadOnlyList<int> rightsIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "DELETE FROM rightslist WHERE admin_id = @AdminId",
                new { AdminId = adminId }, transaction);

            await connection.ExecuteAsync(
                "INSERT INTO rightslist (admin_id, rights_id) VALUES (@AdminId, @RightsId)",
                rightsIds.Distinct().Select(rightsId => new { AdminId = adminId, RightsId = rightsId }), transaction);
        });

    public Task<OperationResult> DeleteRightsListByAllAsync(int adminId, int rightsId) =>
        ExecuteAsync(
            "DELETE FROM rightslist WHERE admin_id = @AdminId AND rights_id = @RightsId",
            new { AdminId = adminId, RightsId = rightsId });
}
