namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

public interface IUserTelephoneRepository
{
    Task<IReadOnlyList<User>> GetUserByFullTelephoneAsync(int countrycode, long phonenumber);
    Task<IReadOnlyList<User>> GetUserByCountrycodeAsync(int countrycode);
    Task<IReadOnlyList<User>> GetUserByPhonenumberAsync(long phonenumber);

    Task<OperationResult> UpdateUserByAllTelephoneAsync(User user, int countrycode, long phonenumber);
    Task<OperationResult> UpdateUserByCountrycodeAsync(User user, int countrycode);
    Task<OperationResult> UpdateUserByPhonenumberAsync(User user, long phonenumber);
}
