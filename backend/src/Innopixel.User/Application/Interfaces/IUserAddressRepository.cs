namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

public interface IUserAddressRepository
{
    Task<IReadOnlyList<User>> GetUserByFullAddressAsync(string streetname, string housenumber);
    Task<IReadOnlyList<User>> GetUserByStreetnameAsync(string streetname);
    Task<IReadOnlyList<User>> GetUserByHousenumberAsync(string housenumber);

    Task<OperationResult> UpdateUserByFullAddressAsync(User user, string streetname, string housenumber);
    Task<OperationResult> UpdateUserByStreetnameAsync(User user, string streetname);
    Task<OperationResult> UpdateUserByHousenumberAsync(User user, string housenumber);
}
