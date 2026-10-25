namespace Innopixel.ChatbotInterpreter.Domain;

// Gyldige værdier for AISUGGESTION.TYPE, med den længde, søgemaskiner/hjemmesiden kan vise.
public static class AiSuggestionType
{
    public const string SeoTitle = "SeoTitle";
    public const string MetaDescription = "MetaDescription";
    public const string ProjectDescription = "ProjectDescription";

    public static bool IsValid(string? type) => type is SeoTitle or MetaDescription or ProjectDescription;

    public static int MaxLength(string type) => type switch
    {
        SeoTitle => 70,
        MetaDescription => 160,
        _ => 2000
    };
}
