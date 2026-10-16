namespace Innopixel.User.Infrastructure;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Enums;
using User = Innopixel.User.Domain.User;

public class UserBirthRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserBirthRepository
{
    public Task<IReadOnlyList<User>> GetUserByFullBirthAsync(DateTime birthday, DateTime birthmonth, DateTime birthyear) =>
        QueryUsersAsync(
            "b.birthday = @Birthday AND b.birthmonth = @Birthmonth AND b.birthyear = @Birthyear",
            new { Birthday = birthday, Birthmonth = birthmonth, Birthyear = birthyear });

    public Task<IReadOnlyList<User>> GetUserByBirthdayAsync(DateTime birthday) =>
        QueryUsersAsync("b.birthday = @Birthday", new { Birthday = birthday });

    public Task<IReadOnlyList<User>> GetUserByBirthmonthAsync(DateTime birthmonth) =>
        QueryUsersAsync("b.birthmonth = @Birthmonth", new { Birthmonth = birthmonth });

    public Task<IReadOnlyList<User>> GetUserByBirthyearAsync(DateTime birthyear) =>
        QueryUsersAsync("b.birthyear = @Birthyear", new { Birthyear = birthyear });

    public Task<OperationResult> UpdateUserByAllBirthAsync(User user, DateTime birthday, DateTime birthmonth, DateTime birthyear) =>
        ExecuteAsync(
            "UPDATE birth SET birthday = @Birthday, birthmonth = @Birthmonth, birthyear = @Birthyear WHERE id = @BirthId",
            new { user.BirthId, Birthday = birthday, Birthmonth = birthmonth, Birthyear = birthyear });

    public Task<OperationResult> UpdateUserByBirthdayAsync(User user, DateTime birthday) =>
        ExecuteAsync("UPDATE birth SET birthday = @Birthday WHERE id = @BirthId", new { user.BirthId, Birthday = birthday });

    public Task<OperationResult> UpdateUserByBirthmonthAsync(User user, DateTime birthmonth) =>
        ExecuteAsync("UPDATE birth SET birthmonth = @Birthmonth WHERE id = @BirthId", new { user.BirthId, Birthmonth = birthmonth });

    public Task<OperationResult> UpdateUserByBirthyearAsync(User user, DateTime birthyear) =>
        ExecuteAsync("UPDATE birth SET birthyear = @Birthyear WHERE id = @BirthId", new { user.BirthId, Birthyear = birthyear });
}
