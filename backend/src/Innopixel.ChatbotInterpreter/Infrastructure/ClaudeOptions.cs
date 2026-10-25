namespace Innopixel.ChatbotInterpreter.Infrastructure;

// Indstillinger for Claude. Uden ApiKey kører chatbotten på faste regler.
public class ClaudeOptions
{
    // Læses fra konfigurationen (user secrets / miljøvariabel), aldrig fra koden.
    public string? ApiKey { get; set; }

    public string Model { get; set; } = "claude-opus-5-5";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ApiKey);
}
