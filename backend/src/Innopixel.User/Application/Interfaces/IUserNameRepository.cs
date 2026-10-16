namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

public interface IUserNameRepository
{
    Task<IReadOnlyList<User>> GetUserByFullnameAsync(string firstname, string? middlename, string lastname);
    Task<IReadOnlyList<User>> GetUserByFirstnameAsync(string firstname);
    Task<IReadOnlyList<User>> GetUserByMiddlenameAsync(string middlename);
    Task<IReadOnlyList<User>> GetUserByLastnameAsync(string lastname);

    Task<OperationResult> UpdateUserByFullnameAsync(User user, string firstname, string? middlename, string lastname);
    Task<OperationResult> UpdateUserByFirstnameAsync(User user, string firstname);
    Task<OperationResult> UpdateUserByMiddlenameAsync(User user, string? middlename);
    Task<OperationResult> UpdateUserByLastnameAsync(User user, string lastname);
}
