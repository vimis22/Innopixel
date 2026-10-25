namespace Innopixel.User.Contracts;

using Innopixel.Shared.Results;

// One password rule for every place a password is chosen. The frontend shows the same rules as a checklist
// (frontend/src/features/auth/passwordPolicy.ts); the server's check is the one that counts.
public static class PasswordPolicy
{
    public const int MinLength = 10;
    public const int MaxLength = 128;

    public static bool IsStrongEnough(string? password) =>
        password is { Length: >= MinLength and <= MaxLength }
        && password.Any(char.IsUpper)
        && password.Any(char.IsLower)
        && password.Any(char.IsDigit)
        && password.Any(c => !char.IsLetterOrDigit(c));

    public static void Validate(string? password)
    {
        if (!IsStrongEnough(password))
        {
            throw ServiceErrorException.Validation("settings.password.tooWeak");
        }
    }
}
