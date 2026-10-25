namespace Innopixel.User.Application;

using System.Security.Cryptography;
using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Microsoft.AspNetCore.Identity;

// Medarbejderkonti og adgangskoder. Fejlbeskederne er nøgler i frontendens da.ts (team.validation.*, settings.*).
public class StaffService(IStaffRepository staffRepository, IPasswordHasher<StaffMember> passwordHasher) : IStaffService
{
    public const int MaxNameLength = 200;
    public const int MaxTitleLength = 100;

    public Task<IReadOnlyList<StaffMember>> GetAllAsync() => staffRepository.GetAllAsync();

    public Task<StaffMember?> GetByIdAsync(int employeeId) => staffRepository.GetByIdAsync(employeeId);

    public async Task<(StaffMember Staff, string TemporaryPassword)> CreateAsync(StaffInput input)
    {
        var record = await ValidateAsync(input, exceptUserId: null);
        var temporaryPassword = GeneratePassword();

        // Hashen beregnes uden en rigtig medarbejder; PasswordHasher bruger ikke objektet til noget.
        // Adgangskoden er valgt af systemet, så medarbejderen skal vælge sin egen ved første login.
        var id = await staffRepository.CreateAsync(record, passwordHasher.HashPassword(Placeholder, temporaryPassword), mustChangePassword: true);
        var staff = await staffRepository.GetByIdAsync(id) ?? throw ServiceErrorException.NotFound();
        return (staff, temporaryPassword);
    }

    public async Task UpdateAsync(int employeeId, StaffInput input)
    {
        _ = await staffRepository.GetByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();
        await staffRepository.UpdateAsync(employeeId, await ValidateAsync(input, employeeId));
    }

    public async Task SetActiveAsync(int employeeId, bool active)
    {
        _ = await staffRepository.GetByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();
        await staffRepository.SetActiveAsync(employeeId, active);
    }

    public async Task UpdateProfileAsync(int employeeId, ProfileInput input)
    {
        var name = ValidateName(input.Name);
        var title = ValidateTitle(input.Title);
        var phone = ValidatePhone(input.Phone);
        var (firstname, middlename, lastname) = StaffFormat.SplitName(name);

        await staffRepository.UpdateProfileAsync(
            employeeId, firstname, middlename, lastname, title, NullIfBlank(input.Department), phone?.Countrycode, phone?.Phonenumber);
    }

    public async Task<Guid> ChangePasswordAsync(int employeeId, string currentPassword, string newPassword)
    {
        var credentials = await staffRepository.GetCredentialsByIdAsync(employeeId) ?? throw ServiceErrorException.NotFound();

        if (credentials.PasswordHash is null
            || passwordHasher.VerifyHashedPassword(credentials.Staff, credentials.PasswordHash, currentPassword ?? string.Empty) == PasswordVerificationResult.Failed)
        {
            throw ServiceErrorException.Validation("settings.password.currentWrong");
        }

        PasswordPolicy.Validate(newPassword);
        if (newPassword == currentPassword)
        {
            throw ServiceErrorException.Validation("settings.password.sameAsCurrent");
        }

        // Den nye adgangskode er medarbejderens egen; en ny security stamp afslutter alle andre sessioner
        return await staffRepository.ReplacePasswordAsync(employeeId, passwordHasher.HashPassword(credentials.Staff, newPassword), mustChangePassword: false);
    }

    // 16 tegn uden tegn, der let forveksles (0/O, 1/l/I), og altid med stort og lille bogstav, tal og specialtegn.
    internal static string GeneratePassword()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ", lower = "abcdefghjkmnpqrstuvwxyz", digits = "23456789", special = "!#%+-=?@";
        var chars = (RandomNumberGenerator.GetString(upper, 1) + RandomNumberGenerator.GetString(lower, 1)
            + RandomNumberGenerator.GetString(digits, 1) + RandomNumberGenerator.GetString(special, 1)
            + RandomNumberGenerator.GetString(upper + lower + digits + special, 12)).ToCharArray();
        RandomNumberGenerator.Shuffle(chars.AsSpan());
        return new string(chars);
    }

    private async Task<StaffRecord> ValidateAsync(StaffInput input, int? exceptUserId)
    {
        var name = ValidateName(input.Name);
        var email = input.Email?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!Validator.IsValidEmail(email))
        {
            throw ServiceErrorException.Validation("team.validation.emailInvalid");
        }

        var title = ValidateTitle(input.Title);
        var phone = ValidatePhone(input.Phone);

        if (await staffRepository.IsEmailInUseAsync(email, exceptUserId))
        {
            throw ServiceErrorException.Validation("team.validation.emailTaken");
        }

        var (firstname, middlename, lastname) = StaffFormat.SplitName(name);
        if (input.ExpectedWeeklyHours is { } hours && (hours < 0 || hours > 80 || hours * 2 != Math.Floor(hours * 2)))
        {
            throw ServiceErrorException.Validation("team.validation.expectedHoursInvalid");
        }

        return new StaffRecord(firstname, middlename, lastname, email, input.IsAdmin, title,
            NullIfBlank(input.Department), phone?.Countrycode, phone?.Phonenumber, input.ExpectedWeeklyHours);
    }

    private static string ValidateName(string? name)
    {
        var trimmed = name?.Trim();
        return string.IsNullOrEmpty(trimmed) || trimmed.Length > MaxNameLength
            ? throw ServiceErrorException.Validation("team.validation.nameRequired")
            : trimmed;
    }

    private static string ValidateTitle(string? title)
    {
        var trimmed = title?.Trim();
        return string.IsNullOrEmpty(trimmed) || trimmed.Length > MaxTitleLength
            ? throw ServiceErrorException.Validation("team.validation.titleRequired")
            : trimmed;
    }

    private static (int Countrycode, long Phonenumber)? ValidatePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        return StaffFormat.IsValidPhone(phone.Trim()) && StaffFormat.ParsePhone(phone) is { } parsed
            ? parsed
            : throw ServiceErrorException.Validation("team.validation.phoneInvalid");
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static readonly StaffMember Placeholder = new(0, string.Empty, string.Empty, false, string.Empty, null, null, true, DateTime.UnixEpoch, 0);
}
