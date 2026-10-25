namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts;

// Det, der gemmes for en medarbejder. Navn og telefon er allerede delt op til databasens tabeller.
public record StaffRecord(
    string Firstname,
    string? Middlename,
    string Lastname,
    string Email,
    bool IsAdmin,
    string Title,
    string? Department,
    int? Countrycode,
    long? Phonenumber,
    decimal? ExpectedWeeklyHours);

public record StaffCredentials(StaffMember Staff, string? PasswordHash, bool MustChangePassword, Guid SecurityStamp, DateTime? LastLoginAt);

public interface IStaffRepository
{
    Task<IReadOnlyList<StaffMember>> GetAllAsync();
    Task<StaffMember?> GetByIdAsync(int employeeId);
    Task<StaffCredentials?> GetCredentialsByEmailAsync(string email);
    Task<StaffCredentials?> GetCredentialsByIdAsync(int employeeId);

    // Er emailen i brug af en anden (ikke-slettet) bruger?
    Task<bool> IsEmailInUseAsync(string email, int? exceptUserId);

    // mustChangePassword: the password was chosen by someone else (temporary)
    Task<int> CreateAsync(StaffRecord staff, string passwordHash, bool mustChangePassword);
    Task UpdateAsync(int employeeId, StaffRecord staff);
    Task UpdateProfileAsync(int employeeId, string firstname, string? middlename, string lastname, string title, string? department, int? countrycode, long? phonenumber);
    Task SetActiveAsync(int employeeId, bool active);
    // Same password in a newer hash format (after a login); sessions stay valid
    Task RehashPasswordAsync(int employeeId, string passwordHash);

    // A new password: also gives the employee a new security stamp, which ends all their sessions. Returns the stamp.
    Task<Guid> ReplacePasswordAsync(int employeeId, string passwordHash, bool mustChangePassword);

    Task RecordLoginAsync(int employeeId, DateTime at);
}
