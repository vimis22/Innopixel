namespace Innopixel.ChatbotInterpreter.Infrastructure;

using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;

// Bruges, når der ikke er konfigureret en API-nøgle. Chatbotten kører så kun på faste regler.
public class DisabledLanguageModelClient : ILanguageModelClient
{
    public bool IsAvailable => false;

    public Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurn> conversation,
        LanguageModelTask task,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<string?>(null);
}
