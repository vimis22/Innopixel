namespace Innopixel.ChatbotInterpreter.Application.Interfaces;

using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.Shared.Results;

public interface IAiSuggestionRepository
{
    // Returnerer det nye id, eller null hvis databasen afviser rækken.
    Task<int?> CreateAiSuggestionAsync(AiSuggestion aiSuggestion);

    Task<AiSuggestion?> GetAiSuggestionByIdAsync(int aiSuggestionId);
    Task<IReadOnlyList<AiSuggestion>> GetAiSuggestionsByProjectsIdAsync(int projectsId);
    Task<IReadOnlyList<AiSuggestion>> GetAiSuggestionsByAcceptedAsync(bool? accepted);

    Task<OperationResult> UpdateAiSuggestionByAcceptedAsync(AiSuggestion aiSuggestion, bool accepted);

    Task<OperationResult> DeleteAiSuggestionByAllInfoAsync(AiSuggestion aiSuggestion);
}
