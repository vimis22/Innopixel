namespace Innopixel.ChatbotInterpreter.Contracts;

using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.Shared.Results;

public interface IChatbotInterpreterService
{
    // --- Chatbot ---

    // Laver et svar på den besøgendes besked. Svarer altid, også uden API-nøgle (faste regler).
    Task<ChatbotResponse> InterpretMessageAsync(
        string text,
        string languageType,
        IReadOnlyList<ChatTurn> history,
        CancellationToken cancellationToken = default);

    Intent DetectIntent(string text);

    // --- AI-forslag til admins (US-21) ---

    bool IsLanguageModelAvailable { get; }

    // Genererer og gemmer et forslag til et projekt. Id i resultatet er forslagets id.
    Task<ValidatedResult> GenerateSuggestionAsync(int projectId, string type, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiSuggestion>> GetSuggestionsByProjectAsync(int projectId);
    Task<IReadOnlyList<AiSuggestion>> GetPendingSuggestionsAsync();

    // Registrerer admin'ens beslutning. Selve indholdet ændres ikke automatisk.
    Task<OperationResult> SetSuggestionAcceptedAsync(int suggestionId, bool accepted);
    Task<OperationResult> DeleteSuggestionAsync(int suggestionId);
}
