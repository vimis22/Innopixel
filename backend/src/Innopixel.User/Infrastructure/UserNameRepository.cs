namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using User = Innopixel.User.Domain.User;

public class UserNameRepository(IDbConnectionFactory connectionFactory)
    : UserRepositoryBase(connectionFactory), IUserNameRepository
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
        UpdateNameAsync(
            "firstname = @Firstname, middlename = @Middlename, lastname = @Lastname",
            new { user.Id, Firstname = firstname, Middlename = middlename, Lastname = lastname });

    public Task<OperationResult> UpdateUserByFirstnameAsync(User user, string firstname) =>
        UpdateNameAsync("firstname = @Firstname", new { user.Id, Firstname = firstname });

    public Task<OperationResult> UpdateUserByMiddlenameAsync(User user, string? middlename) =>
        UpdateNameAsync("middlename = @Middlename", new { user.Id, Middlename = middlename });

    public Task<OperationResult> UpdateUserByLastnameAsync(User user, string lastname) =>
        UpdateNameAsync("lastname = @Lastname", new { user.Id, Lastname = lastname });

    private Task<OperationResult> UpdateNameAsync(string setClause, object param) =>
        UpdateUserPartAsync("name", "name_id", setClause, param);
}
