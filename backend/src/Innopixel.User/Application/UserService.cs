namespace Innopixel.User.Application;

using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public class UserService(IUserRepository userRepository) : IUserService
{
    public Task<OperationResult> CreateUserAsync(UserInfo userInfo) =>
        IsValid(userInfo)
            ? userRepository.CreateUserAsync(userInfo)
            : Task.FromResult(OperationResult.InvalidInput);

    // Fornavn og efternavn er påkrævet. Email er valgfri, men skal være gyldig, hvis den er angivet.
    internal static bool IsValid(UserInfo userInfo) =>
        !string.IsNullOrWhiteSpace(userInfo.Firstname)
        && !string.IsNullOrWhiteSpace(userInfo.Lastname)
        && (userInfo.Email is null || Validator.IsValidEmail(userInfo.Email));

    public Task<IReadOnlyList<User>> GetUserByIdAsync(int userId) =>
        userRepository.GetUserByIdAsync(userId);

    public Task<OperationResult> DeleteUserByAllInfoAsync(User user) =>
        userRepository.DeleteUserByAllInfoAsync(user);
}
