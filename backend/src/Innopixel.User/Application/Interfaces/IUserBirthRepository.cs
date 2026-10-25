namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

public interface IUserBirthRepository
{
    Task<IReadOnlyList<User>> GetUserByFullBirthAsync(DateTime birthday, DateTime birthmonth, DateTime birthyear);
    Task<IReadOnlyList<User>> GetUserByBirthdayAsync(DateTime birthday);
    Task<IReadOnlyList<User>> GetUserByBirthmonthAsync(DateTime birthmonth);
    Task<IReadOnlyList<User>> GetUserByBirthyearAsync(DateTime birthyear);

    Task<OperationResult> UpdateUserByAllBirthAsync(User user, DateTime birthday, DateTime birthmonth, DateTime birthyear);
    Task<OperationResult> UpdateUserByBirthdayAsync(User user, DateTime birthday);
    Task<OperationResult> UpdateUserByBirthmonthAsync(User user, DateTime birthmonth);
    Task<OperationResult> UpdateUserByBirthyearAsync(User user, DateTime birthyear);
}
