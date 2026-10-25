namespace Innopixel.ChatbotSystem.Infrastructure;

using Innopixel.ChatbotSystem.Application.Interfaces;
using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ChatMessageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IChatMessageRepository
{
    public Task<OperationResult> CreateChatMessageAsync(int chatSessionId, string sender, string text, string? intent) =>
        ExecuteAsync(
            "INSERT INTO chatmessage (sender, text, sendtime, intent, chatsession_id) VALUES (@Sender, @Text, now(), @Intent, @ChatSessionId)",
            new { Sender = sender, Text = text, Intent = intent, ChatSessionId = chatSessionId });

    // Der reserveres plads til beskeden og chatbottens svar (2 beskeder).
    public Task<OperationResult> CreateChatMessageWithinLimitAsync(int chatSessionId, string sender, string text, string? intent, int maxMessages) =>
        ExecuteAsync(
            """
            INSERT INTO chatmessage (sender, text, sendtime, intent, chatsession_id)
            SELECT @Sender, @Text, now(), @Intent, @ChatSessionId
            WHERE (SELECT COUNT(*) FROM chatmessage WHERE chatsession_id = @ChatSessionId) <= @MaxMessages - 2
            """,
            new { Sender = sender, Text = text, Intent = intent, ChatSessionId = chatSessionId, MaxMessages = maxMessages });

    public Task<ChatMessage?> GetChatMessageByIdAsync(int chatMessageId) =>
        QuerySingleAsync<ChatMessage>("SELECT * FROM chatmessage WHERE id = @Id", new { Id = chatMessageId });

    public Task<IReadOnlyList<ChatMessage>> GetChatMessagesBySessionIdAsync(int chatSessionId) =>
        QueryAsync<ChatMessage>(
            "SELECT * FROM chatmessage WHERE chatsession_id = @ChatSessionId ORDER BY sendtime, id",
            new { ChatSessionId = chatSessionId });

    public Task<IReadOnlyList<ChatMessage>> GetChatMessagesByIntentAsync(string intent) =>
        QueryAsync<ChatMessage>(
            "SELECT * FROM chatmessage WHERE intent = @Intent ORDER BY sendtime DESC",
            new { Intent = intent });

    public async Task<int> CountChatMessagesBySessionIdAsync(int chatSessionId) =>
        await QuerySingleAsync<int>(
            "SELECT COUNT(*)::int FROM chatmessage WHERE chatsession_id = @ChatSessionId",
            new { ChatSessionId = chatSessionId });

    public Task<OperationResult> DeleteChatMessagesBySessionIdAsync(int chatSessionId) =>
        ExecuteAsync("DELETE FROM chatmessage WHERE chatsession_id = @ChatSessionId", new { ChatSessionId = chatSessionId });
}
