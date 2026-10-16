namespace Innopixel.User.Infrastructure;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Enums;
using User = Innopixel.User.Domain.User;

public class UserNameRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserNameRepository
{
    public Task<IReadOnlyList<User>> GetUserByFullnameAsync(string firstname, string? middlename, string lastname) =>
        QueryUsersAsync(
            "n.firstname = @Firstname AND n.middlename IS NOT DISTINCT FROM @Middlename AND n.lastname = @Lastname",
            new { Firstname = firstname, Middlename = middlename, Lastname = lastname });

    public Task<IReadOnlyList<User>> GetUserByFirstnameAsync(string firstname) =>
        QueryUsersAsync("n.firstname = @Firstname", new { Firstname = firstname });

    public Task<IReadOnlyList<User>> GetUserByMiddlenameAsync(string middlename) =>
        QueryUsersAsync("n.middlename = @Middlename", new { Middlename = middlename });

    public Task<IReadOnlyList<User>> GetUserByLastnameAsync(string lastname) =>
        QueryUsersAsync("n.lastname = @Lastname", new { Lastname = lastname });

    public Task<OperationResult> UpdateUserByFullnameAsync(User user, string firstname, string? middlename, string lastname) =>
        ExecuteAsync(
            "UPDATE name SET firstname = @Firstname, middlename = @Middlename, lastname = @Lastname WHERE id = @NameId",
            new { user.NameId, Firstname = firstname, Middlename = middlename, Lastname = lastname });

    public Task<OperationResult> UpdateUserByFirstnameAsync(User user, string firstname) =>
        ExecuteAsync("UPDATE name SET firstname = @Firstname WHERE id = @NameId", new { user.NameId, Firstname = firstname });

    public Task<OperationResult> UpdateUserByMiddlenameAsync(User user, string? middlename) =>
        ExecuteAsync("UPDATE name SET middlename = @Middlename WHERE id = @NameId", new { user.NameId, Middlename = middlename });

    public Task<OperationResult> UpdateUserByLastnameAsync(User user, string lastname) =>
        ExecuteAsync("UPDATE name SET lastname = @Lastname WHERE id = @NameId", new { user.NameId, Lastname = lastname });
}
