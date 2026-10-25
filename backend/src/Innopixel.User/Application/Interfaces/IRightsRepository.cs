namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

public interface IRightsRepository
{
    Task<OperationResult> CreateRightsAsync(Rights rightsInfo);

    Task<IReadOnlyList<Rights>> GetRightsByIdAsync(int rightsId);
    Task<IReadOnlyList<Rights>> GetRightsByAllInfoAsync(bool create, bool read, bool update, bool delete);
    Task<IReadOnlyList<Rights>> GetRightsByCreateAsync(bool create);
    Task<IReadOnlyList<Rights>> GetRightsByReadAsync(bool read);
    Task<IReadOnlyList<Rights>> GetRightsByUpdateAsync(bool update);
    Task<IReadOnlyList<Rights>> GetRightsByDeleteAsync(bool delete);
    Task<IReadOnlyList<Rights>> GetRightsByAdminIdAsync(int adminId);
    Task<IReadOnlyList<Rights>> GetRightsByAdminIdAndServiceIdAsync(int adminId, int serviceId);

    Task<OperationResult> UpdateRightsByFullAsync(Rights rights, bool create, bool read, bool update, bool delete);
    Task<OperationResult> UpdateRightsByCreateAsync(Rights rights, bool create);
    Task<OperationResult> UpdateRightsByReadAsync(Rights rights, bool read);
    Task<OperationResult> UpdateRightsByUpdateAsync(Rights rights, bool update);
    Task<OperationResult> UpdateRightsByDeleteAsync(Rights rights, bool delete);

    Task<OperationResult> DeleteRightsByAllInfoAsync(Rights rights);
}
