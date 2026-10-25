namespace Innopixel.User.Application;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Domain;

public class AccessService(IRightsRepository rightsRepository) : IAccessService
{
    public async Task<bool> HasPermissionAsync(int adminId, Permission permission) =>
        Grants(await rightsRepository.GetRightsByAdminIdAsync(adminId), permission);

    public async Task<bool> HasPermissionForServiceAsync(int adminId, int serviceId, Permission permission) =>
        Grants(await rightsRepository.GetRightsByAdminIdAndServiceIdAsync(adminId, serviceId), permission);

    // Tilladelsen gives, hvis mindst én af rettighederne har den slået til.
    internal static bool Grants(IEnumerable<Rights> rights, Permission permission) =>
        rights.Any(r => permission switch
        {
            Permission.Create => r.Create,
            Permission.Read => r.Read,
            Permission.Update => r.Update,
            Permission.Delete => r.Delete,
            _ => false
        });
}
