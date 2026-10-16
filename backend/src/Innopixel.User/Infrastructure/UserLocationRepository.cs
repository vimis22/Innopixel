namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;
using User = Innopixel.User.Domain.User;

public class UserLocationRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserLocationRepository
{
    public Task<OperationResult> AssignLocationToUserAsync(int userId, int locationId) =>
        SetLocationAsync(userId, locationId);

    public async Task<Location?> GetLocationByUserIdAsync(int userId)
    {
        using var connection = ConnectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Location>(
            """
            SELECT l.*
            FROM location l
            JOIN "user" u ON u.location_id = l.id
            WHERE u.id = @UserId AND u.deleted_at IS NULL
            """,
            new { UserId = userId });
    }

    public Task<IReadOnlyList<User>> GetUsersByLocationIdAsync(int locationId) =>
        QueryUsersAsync("u.location_id = @LocationId", new { LocationId = locationId });

    public Task<OperationResult> UpdateUserLocationAsync(int userId, int newLocationId) =>
        SetLocationAsync(userId, newLocationId);

    public Task<OperationResult> RemoveLocationFromUserAsync(int userId) =>
        SetLocationAsync(userId, null);

    private Task<OperationResult> SetLocationAsync(int userId, int? locationId) =>
        ExecuteAsync(
            "UPDATE \"user\" SET location_id = @LocationId WHERE id = @UserId AND deleted_at IS NULL",
            new { UserId = userId, LocationId = locationId });
}
