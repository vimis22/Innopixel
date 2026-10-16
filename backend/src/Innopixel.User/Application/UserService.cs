namespace Innopixel.User.Application;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

public class UserService(IUserRepository userRepository) : IUserService
{
    public Task<OperationResult> CreateUserAsync(UserInfo userInfo)
    {
        if (string.IsNullOrWhiteSpace(userInfo.Firstname) || string.IsNullOrWhiteSpace(userInfo.Lastname))
        {
            return Task.FromResult(OperationResult.InvalidInput);
        }

        return userRepository.CreateUserAsync(userInfo);
    }

    public Task<IReadOnlyList<User>> GetUserByIdAsync(int userId) =>
        userRepository.GetUserByIdAsync(userId);

    public Task<OperationResult> DeleteUserByAllInfoAsync(User user) =>
        userRepository.DeleteUserByAllInfoAsync(user);
}
