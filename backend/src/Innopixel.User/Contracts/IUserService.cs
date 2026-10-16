namespace Innopixel.User.Contracts;

using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

public interface IUserService
{
    Task<OperationResult> CreateUserAsync(UserInfo userInfo);
    Task<IReadOnlyList<User>> GetUserByIdAsync(int userId);
    Task<OperationResult> DeleteUserByAllInfoAsync(User user);
}
