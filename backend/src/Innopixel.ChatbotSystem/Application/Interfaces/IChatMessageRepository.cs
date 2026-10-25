namespace Innopixel.ChatbotSystem.Application.Interfaces;

using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Results;

public interface IChatMessageRepository
{
    Task<OperationResult> CreateChatMessageAsync(int chatSessionId, string sender, string text, string? intent);

    // Gemmer beskeden, men kun hvis sessionen har plads til den og et svar (højst maxMessages i alt).
    // Grænsen tjekkes i samme SQL-sætning som indsættelsen. NotFound, hvis grænsen er nået.
    Task<OperationResult> CreateChatMessageWithinLimitAsync(int chatSessionId, string sender, string text, string? intent, int maxMessages);

    Task<ChatMessage?> GetChatMessageByIdAsync(int chatMessageId);
    Task<IReadOnlyList<ChatMessage>> GetChatMessagesBySessionIdAsync(int chatSessionId);
    Task<IReadOnlyList<ChatMessage>> GetChatMessagesByIntentAsync(string intent);
    Task<int> CountChatMessagesBySessionIdAsync(int chatSessionId);

    Task<OperationResult> DeleteChatMessagesBySessionIdAsync(int chatSessionId);
}
