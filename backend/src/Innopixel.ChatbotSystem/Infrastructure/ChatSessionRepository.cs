namespace Innopixel.ChatbotSystem.Infrastructure;

using Innopixel.ChatbotSystem.Application.Interfaces;
using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ChatSessionRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IChatSessionRepository
{
    public Task<int?> CreateChatSessionAsync(ChatSession chatSessionInfo) =>
        InsertReturningIdAsync(
            "INSERT INTO chatsession (token, startedat, status, languagetype) VALUES (@Token, now(), @Status, @LanguageType) RETURNING id",
            chatSessionInfo);

    public Task<ChatSession?> GetChatSessionByIdAsync(int chatSessionId) =>
        QuerySingleAsync<ChatSession>("SELECT * FROM chatsession WHERE id = @Id", new { Id = chatSessionId });

    public Task<ChatSession?> GetChatSessionByTokenAsync(Guid token) =>
        QuerySingleAsync<ChatSession>("SELECT * FROM chatsession WHERE token = @Token", new { Token = token });

    public Task<IReadOnlyList<ChatSession>> GetChatSessionByStatusAsync(string status) =>
        QueryAsync<ChatSession>(
            "SELECT * FROM chatsession WHERE status = @Status ORDER BY startedat DESC",
            new { Status = status });

    public Task<IReadOnlyList<ChatSession>> GetChatSessionByDateRangeAsync(DateTime fromDate, DateTime toDate) =>
        QueryAsync<ChatSession>(
            "SELECT * FROM chatsession WHERE startedat BETWEEN @FromDate AND @ToDate ORDER BY startedat DESC",
            new { FromDate = fromDate, ToDate = toDate });

    public Task<OperationResult> UpdateChatSessionByStatusAsync(ChatSession chatSession, string status) =>
        ExecuteAsync("UPDATE chatsession SET status = @Status WHERE id = @Id", new { chatSession.Id, Status = status });

    public Task<OperationResult> EndChatSessionAsync(int chatSessionId) =>
        ExecuteAsync(
            "UPDATE chatsession SET status = @Status, endedat = now() WHERE id = @Id AND status = @Active",
            new { Id = chatSessionId, Status = ChatSessionStatus.Ended, Active = ChatSessionStatus.Active });

    public Task<OperationResult> ClaimChatSessionForContactAsync(int chatSessionId) =>
        ExecuteAsync(
            """
            UPDATE chatsession
            SET status = @Converted, endedat = COALESCE(endedat, now())
            WHERE id = @Id AND contact_id IS NULL AND status <> @Converted
            """,
            new { Id = chatSessionId, Converted = ChatSessionStatus.ConvertedToContact });

    public Task<OperationResult> ReleaseChatSessionClaimAsync(ChatSession previous) =>
        ExecuteAsync(
            "UPDATE chatsession SET status = @Status, endedat = @EndedAt WHERE id = @Id AND contact_id IS NULL",
            new { previous.Id, previous.Status, previous.EndedAt });

    public Task<OperationResult> UpdateChatSessionByContactAsync(int chatSessionId, int contactId) =>
        ExecuteAsync(
            "UPDATE chatsession SET contact_id = @ContactId WHERE id = @Id AND contact_id IS NULL",
            new { Id = chatSessionId, ContactId = contactId });

    public Task<OperationResult> DeleteChatSessionByAllInfoAsync(ChatSession chatSession) =>
        ExecuteAsync(
            """
            WITH messages AS (DELETE FROM chatmessage WHERE chatsession_id = @Id)
            DELETE FROM chatsession WHERE id = @Id
            """,
            new { chatSession.Id });

    public Task<OperationResult> DeleteChatSessionsOlderThanAsync(DateTime date) =>
        ExecuteAsync(
            """
            WITH old AS (SELECT id FROM chatsession WHERE startedat < @Date),
                 messages AS (DELETE FROM chatmessage WHERE chatsession_id IN (SELECT id FROM old))
            DELETE FROM chatsession WHERE id IN (SELECT id FROM old)
            """,
            new { Date = date });
}
