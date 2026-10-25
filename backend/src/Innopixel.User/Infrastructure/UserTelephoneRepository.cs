namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using User = Innopixel.User.Domain.User;

public class UserTelephoneRepository(IDbConnectionFactory connectionFactory)
    : UserRepositoryBase(connectionFactory), IUserTelephoneRepository
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
        UpdateTelephoneAsync(
            "countrycode = @Countrycode, phonenumber = @Phonenumber",
            new { user.Id, Countrycode = countrycode, Phonenumber = phonenumber });

    public Task<OperationResult> UpdateUserByCountrycodeAsync(User user, int countrycode) =>
        UpdateTelephoneAsync("countrycode = @Countrycode", new { user.Id, Countrycode = countrycode });

    public Task<OperationResult> UpdateUserByPhonenumberAsync(User user, long phonenumber) =>
        UpdateTelephoneAsync("phonenumber = @Phonenumber", new { user.Id, Phonenumber = phonenumber });

    private Task<OperationResult> UpdateTelephoneAsync(string setClause, object param) =>
        UpdateUserPartAsync("telephone", "telephone_id", setClause, param);
}
