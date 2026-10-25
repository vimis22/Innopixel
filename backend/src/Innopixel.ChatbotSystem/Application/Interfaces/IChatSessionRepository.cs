namespace Innopixel.ChatbotSystem.Application.Interfaces;

using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Results;

public interface IChatSessionRepository
{
    // Returnerer det nye id, eller null hvis databasen afviser rækken.
    Task<int?> CreateChatSessionAsync(ChatSession chatSessionInfo);

    Task<ChatSession?> GetChatSessionByIdAsync(int chatSessionId);
    Task<ChatSession?> GetChatSessionByTokenAsync(Guid token);
    Task<IReadOnlyList<ChatSession>> GetChatSessionByStatusAsync(string status);
    Task<IReadOnlyList<ChatSession>> GetChatSessionByDateRangeAsync(DateTime fromDate, DateTime toDate);

    Task<OperationResult> UpdateChatSessionByStatusAsync(ChatSession chatSession, string status);
    Task<OperationResult> EndChatSessionAsync(int chatSessionId);

    // Markerer sessionen som konverteret i én SQL-sætning. NotFound, hvis den allerede er konverteret,
    // så to samtidige forsøg ikke begge opretter en henvendelse.
    Task<OperationResult> ClaimChatSessionForContactAsync(int chatSessionId);

    // Fortryder ClaimChatSessionForContactAsync, hvis henvendelsen ikke kunne oprettes.
    Task<OperationResult> ReleaseChatSessionClaimAsync(ChatSession previous);

    Task<OperationResult> UpdateChatSessionByContactAsync(int chatSessionId, int contactId);

    // Sletter sessionen og alle dens beskeder.
    Task<OperationResult> DeleteChatSessionByAllInfoAsync(ChatSession chatSession);

    // Oprydning (GDPR): sletter sessioner startet før date, med deres beskeder.
    Task<OperationResult> DeleteChatSessionsOlderThanAsync(DateTime date);
}
