namespace Innopixel.Shared.Validation;

using System.Net.Mail;

// Små, genbrugelige valideringsregler, som alle modulernes services bruger.
public static class Validator
{
    public static bool IsValidEmail(string? email) =>
        !string.IsNullOrWhiteSpace(email)
        && email.Length <= 254
        && MailAddress.TryCreate(email, out var address)
        && address.Address == email.Trim();

    // Tilføjer en fejl, hvis værdien er tom eller længere end maxLength.
    public static void Required(List<string> errors, string? value, string field, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{field} is required.");
        }
        else if (value.Length > maxLength)
        {
            errors.Add($"{field} must be at most {maxLength} characters.");
        }
    }

    // Som Required, men en tom værdi er tilladt.
    public static void Optional(List<string> errors, string? value, string field, int maxLength)
    {
        if (value is not null && value.Length > maxLength)
        {
            errors.Add($"{field} must be at most {maxLength} characters.");
        }
    }
}
