namespace Innopixel.Projects.Domain;

// Gyldige værdier for LANGUAGES.LANGUAGETYPE (US-18: danske og internationale kunder).
public static class LanguageTypes
{
    public const string Danish = "da";
    public const string English = "en";

    public static bool IsValid(string? languageType) => languageType is Danish or English;
}
