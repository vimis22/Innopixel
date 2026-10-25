namespace Innopixel.ChatbotSystem.Contracts;

using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Results;

public interface IChatbotSystemService
{
    // --- Den besøgende: alle kald sker med sessionens hemmelige token, aldrig med id ---

    Task<ChatSessionStartResult> StartSessionAsync(string languageType);

    // Gemmer den besøgendes besked, får et svar fra interpreteren og gemmer svaret.
    Task<ChatReplyResult> SendMessageAsync(Guid sessionToken, string text, CancellationToken cancellationToken = default);

    Task<OperationResult> EndSessionAsync(Guid sessionToken);
    Task<IReadOnlyList<ChatMessage>> GetSessionMessagesAsync(Guid sessionToken);

    // Laver samtalen om til en henvendelse i kontaktsystemet (US-16). Id i resultatet er kontaktens id.
    Task<ValidatedResult> ConvertChatToContactAsync(Guid sessionToken, string fullname, string email);

    // --- Administration ---
    Task<IReadOnlyList<ChatSession>> GetSessionsAsync(DateTime fromDate, DateTime toDate);
    Task<IReadOnlyList<ChatMessage>> GetSessionMessagesByIdAsync(int chatSessionId);
    Task<OperationResult> DeleteSessionAsync(int chatSessionId);

    // Oprydning (GDPR): sletter samtaler ældre end retentionDays dage.
    Task<OperationResult> DeleteSessionsOlderThanAsync(int retentionDays);
}
