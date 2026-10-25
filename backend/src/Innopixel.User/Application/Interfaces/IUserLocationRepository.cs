namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen USER.LOCATION_ID (svarer til "LocationList").
public interface IUserLocationRepository
{
    Task<OperationResult> AssignLocationToUserAsync(int userId, int locationId);

    Task<Location?> GetLocationByUserIdAsync(int userId);
    Task<IReadOnlyList<User>> GetUsersByLocationIdAsync(int locationId);

    Task<OperationResult> UpdateUserLocationAsync(int userId, int newLocationId);

    Task<OperationResult> RemoveLocationFromUserAsync(int userId);
}
