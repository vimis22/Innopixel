namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using User = Innopixel.User.Domain.User;

public class UserBirthRepository(IDbConnectionFactory connectionFactory)
    : UserRepositoryBase(connectionFactory), IUserBirthRepository
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
        UpdateBirthAsync(
            "birthday = @Birthday, birthmonth = @Birthmonth, birthyear = @Birthyear",
            new { user.Id, Birthday = birthday, Birthmonth = birthmonth, Birthyear = birthyear });

    public Task<OperationResult> UpdateUserByBirthdayAsync(User user, DateTime birthday) =>
        UpdateBirthAsync("birthday = @Birthday", new { user.Id, Birthday = birthday });

    public Task<OperationResult> UpdateUserByBirthmonthAsync(User user, DateTime birthmonth) =>
        UpdateBirthAsync("birthmonth = @Birthmonth", new { user.Id, Birthmonth = birthmonth });

    public Task<OperationResult> UpdateUserByBirthyearAsync(User user, DateTime birthyear) =>
        UpdateBirthAsync("birthyear = @Birthyear", new { user.Id, Birthyear = birthyear });

    private Task<OperationResult> UpdateBirthAsync(string setClause, object param) =>
        UpdateUserPartAsync("birth", "birth_id", setClause, param);
}
