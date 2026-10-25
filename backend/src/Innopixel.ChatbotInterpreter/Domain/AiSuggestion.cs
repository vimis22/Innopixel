namespace Innopixel.ChatbotInterpreter.Domain;

// Et AI-genereret forslag, som en admin skal godkende eller afvise (US-21).
// Forslaget ændrer aldrig indhold af sig selv.
public class AiSuggestion
{
    public int Id { get; set; }
    public string Type { get; set; } = AiSuggestionType.SeoTitle;
    public string? OriginalText { get; set; }
    public string SuggestedText { get; set; } = string.Empty;

    // null = ikke behandlet endnu, true = godkendt, false = afvist.
    public bool? Accepted { get; set; }

    public DateTime CreatedAt { get; set; }
    public int ProjectsId { get; set; }
}
