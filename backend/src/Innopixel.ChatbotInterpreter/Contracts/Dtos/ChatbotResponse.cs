namespace Innopixel.ChatbotInterpreter.Contracts.Dtos;

using Innopixel.ChatbotInterpreter.Domain;

// UsedLanguageModel = false betyder, at svaret kommer fra de faste regler (ingen API-nøgle, eller Claude fejlede).
public record ChatbotResponse(string Text, Intent Intent, bool UsedLanguageModel);
