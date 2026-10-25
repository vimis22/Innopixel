namespace Innopixel.Projects.Application;

using Innopixel.Shared.Validation;

// Fælles regel for navne på teknologier og kategorier.
internal static class NameRules
{
    public const int MaxNameLength = 100;

    public static List<string> Validate(string? name)
    {
        var errors = new List<string>();
        Validator.Required(errors, name, "Name", MaxNameLength);
        return errors;
    }
}
