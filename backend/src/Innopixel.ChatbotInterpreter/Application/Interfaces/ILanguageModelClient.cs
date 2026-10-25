namespace Innopixel.ChatbotInterpreter.Application.Interfaces;

using Innopixel.ChatbotInterpreter.Contracts.Dtos;

// Abstraktion over sprogmodellen, så resten af modulet ikke afhænger af Anthropic SDK'et.
public interface ILanguageModelClient
{
    bool IsAvailable { get; }

    // Returnerer modellens tekstsvar, eller null hvis modellen ikke er tilgængelig, fejlede eller afviste.
    Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurn> conversation,
        LanguageModelTask task,
        CancellationToken cancellationToken = default);
}

// Bestemmer, hvor meget modellen må "tænke": chat skal være hurtig, forslag må være grundigere.
public enum LanguageModelTask
{
    Chat,
    Suggestion
}
