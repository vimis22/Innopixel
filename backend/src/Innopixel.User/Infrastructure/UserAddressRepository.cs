namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using User = Innopixel.User.Domain.User;

public class UserAddressRepository(IDbConnectionFactory connectionFactory)
    : UserRepositoryBase(connectionFactory), IUserAddressRepository
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
        UpdateAddressAsync(
            "streetname = @Streetname, housenumber = @Housenumber",
            new { user.Id, Streetname = streetname, Housenumber = housenumber });

    public Task<OperationResult> UpdateUserByStreetnameAsync(User user, string streetname) =>
        UpdateAddressAsync("streetname = @Streetname", new { user.Id, Streetname = streetname });

    public Task<OperationResult> UpdateUserByHousenumberAsync(User user, string housenumber) =>
        UpdateAddressAsync("housenumber = @Housenumber", new { user.Id, Housenumber = housenumber });

    private Task<OperationResult> UpdateAddressAsync(string setClause, object param) =>
        UpdateUserPartAsync("address", "address_id", setClause, param);
}
