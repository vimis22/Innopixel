namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

public interface IUserRepository
{
    Task<OperationResult> CreateUserAsync(UserInfo userInfo);

    Task<IReadOnlyList<User>> GetUserByIdAsync(int userId);
    Task<IReadOnlyList<User>> GetUserByEmailAsync(string email);

    Task<OperationResult> UpdateUserByEmailAsync(User user, string email);

    Task<OperationResult> DeleteUserByAllInfoAsync(User user);
}
