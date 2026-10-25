namespace Innopixel.User.Contracts;

// Adgangskontrol (US-22): må en admin udføre en handling?
public interface IAccessService
{
    // Har admin'en tilladelsen via mindst én af sine rettigheder?
    Task<bool> HasPermissionAsync(int adminId, Permission permission);

    // Har admin'en tilladelsen via en rettighed, der er koblet til servicen i SERVICELIST?
    Task<bool> HasPermissionForServiceAsync(int adminId, int serviceId, Permission permission);
}
