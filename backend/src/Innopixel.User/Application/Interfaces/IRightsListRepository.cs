namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen ADMIN <-> RIGHTS.
public interface IRightsListRepository
{
    Task<OperationResult> CreateRightsListAsync(RightsList rightsListInfo);

    Task<IReadOnlyList<RightsList>> GetRightsListByFullAsync(int adminId, int rightsId);
    Task<IReadOnlyList<RightsList>> GetRightsListByAdminIdAsync(int adminId);
    Task<IReadOnlyList<RightsList>> GetRightsListByRightsIdAsync(int rightsId);

    // Erstatter alle admin'ens rettigheder med rightsIds.
    Task<OperationResult> UpdateRightsListByRightsAsync(int adminId, IReadOnlyList<int> rightsIds);

    Task<OperationResult> DeleteRightsListByAllAsync(int adminId, int rightsId);
}
