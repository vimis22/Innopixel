namespace Innopixel.User.Infrastructure;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Enums;
using User = Innopixel.User.Domain.User;

public class UserTelephoneRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserTelephoneRepository
{
    public Task<IReadOnlyList<User>> GetUserByFullTelephoneAsync(int countrycode, long phonenumber) =>
        QueryUsersAsync(
            "t.countrycode = @Countrycode AND t.phonenumber = @Phonenumber",
            new { Countrycode = countrycode, Phonenumber = phonenumber });

    public Task<IReadOnlyList<User>> GetUserByCountrycodeAsync(int countrycode) =>
        QueryUsersAsync("t.countrycode = @Countrycode", new { Countrycode = countrycode });

    public Task<IReadOnlyList<User>> GetUserByPhonenumberAsync(long phonenumber) =>
        QueryUsersAsync("t.phonenumber = @Phonenumber", new { Phonenumber = phonenumber });

    public Task<OperationResult> UpdateUserByAllTelephoneAsync(User user, int countrycode, long phonenumber) =>
        ExecuteAsync(
            "UPDATE telephone SET countrycode = @Countrycode, phonenumber = @Phonenumber WHERE id = @TelephoneId",
            new { user.TelephoneId, Countrycode = countrycode, Phonenumber = phonenumber });

    public Task<OperationResult> UpdateUserByCountrycodeAsync(User user, int countrycode) =>
        ExecuteAsync("UPDATE telephone SET countrycode = @Countrycode WHERE id = @TelephoneId", new { user.TelephoneId, Countrycode = countrycode });

    public Task<OperationResult> UpdateUserByPhonenumberAsync(User user, long phonenumber) =>
        ExecuteAsync("UPDATE telephone SET phonenumber = @Phonenumber WHERE id = @TelephoneId", new { user.TelephoneId, Phonenumber = phonenumber });
}
