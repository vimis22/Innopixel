namespace Innopixel.User.Infrastructure;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Enums;
using User = Innopixel.User.Domain.User;

public class UserAddressRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserAddressRepository
{
    public Task<IReadOnlyList<User>> GetUserByFullAddressAsync(string streetname, string housenumber) =>
        QueryUsersAsync(
            "a.streetname = @Streetname AND a.housenumber = @Housenumber",
            new { Streetname = streetname, Housenumber = housenumber });

    public Task<IReadOnlyList<User>> GetUserByStreetnameAsync(string streetname) =>
        QueryUsersAsync("a.streetname = @Streetname", new { Streetname = streetname });

    public Task<IReadOnlyList<User>> GetUserByHousenumberAsync(string housenumber) =>
        QueryUsersAsync("a.housenumber = @Housenumber", new { Housenumber = housenumber });

    public Task<OperationResult> UpdateUserByFullAddressAsync(User user, string streetname, string housenumber) =>
        ExecuteAsync(
            "UPDATE address SET streetname = @Streetname, housenumber = @Housenumber WHERE id = @AddressId",
            new { user.AddressId, Streetname = streetname, Housenumber = housenumber });

    public Task<OperationResult> UpdateUserByStreetnameAsync(User user, string streetname) =>
        ExecuteAsync("UPDATE address SET streetname = @Streetname WHERE id = @AddressId", new { user.AddressId, Streetname = streetname });

    public Task<OperationResult> UpdateUserByHousenumberAsync(User user, string housenumber) =>
        ExecuteAsync("UPDATE address SET housenumber = @Housenumber WHERE id = @AddressId", new { user.AddressId, Housenumber = housenumber });
}
