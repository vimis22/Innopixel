namespace Innopixel.ChatbotSystem.Application;

using System.Text;
using Innopixel.ChatbotInterpreter.Contracts;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Innopixel.ChatbotSystem.Application.Interfaces;
using Innopixel.ChatbotSystem.Contracts;
using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Results;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Microsoft.Extensions.Logging;

public class ChatbotSystemService(
    IChatSessionRepository chatSessionRepository,
    IChatMessageRepository chatMessageRepository,
    IChatbotInterpreterService interpreter,
    IContactService contactService,
    TimeProvider timeProvider,
    ILogger<ChatbotSystemService> logger) : IChatbotSystemService
{
    public const int MaxMessageLength = 1000;

    // Begrænser misbrug og omkostninger: en samtale kan højst have så mange beskeder (besøgende + bot).
    public const int MaxMessagesPerSession = 60;

    public static readonly string[] SupportedLanguages = ["da", "en"];

    public async Task<ChatSessionStartResult> StartSessionAsync(string languageType)
    {
        var language = languageType?.Trim().ToLowerInvariant();
        if (!SupportedLanguages.Contains(language))
        {
            return ChatSessionStartResult.Invalid($"Language must be one of: {string.Join(", ", SupportedLanguages)}.");
        }

        var token = Guid.NewGuid();
        var id = await chatSessionRepository.CreateChatSessionAsync(new ChatSession { Token = token, LanguageType = language! });
        return id is null ? ChatSessionStartResult.From(OperationResult.Failed) : ChatSessionStartResult.Success(token);
    }

    public async Task<ChatReplyResult> SendMessageAsync(Guid sessionToken, string text, CancellationToken cancellationToken = default)
    {
        var message = text?.Trim();
        if (string.IsNullOrEmpty(message))
        {
            return ChatReplyResult.Invalid("Message is required.");
        }

        if (message.Length > MaxMessageLength)
        {
            return ChatReplyResult.Invalid($"Message must be at most {MaxMessageLength} characters.");
        }

        var session = await chatSessionRepository.GetChatSessionByTokenAsync(sessionToken);
        if (session is null)
        {
            return ChatReplyResult.From(OperationResult.NotFound);
        }

        if (session.Status != ChatSessionStatus.Active)
        {
            return ChatReplyResult.Invalid("This chat has ended. Please start a new chat.");
        }

        var history = (await chatMessageRepository.GetChatMessagesBySessionIdAsync(session.Id))
            .Select(m => new ChatTurn(m.Sender == ChatSender.User, m.Text))
            .ToList();

        // Den besøgendes besked gemmes, før sprogmodellen kaldes, og grænsen tjekkes i samme SQL-sætning.
        // Så kan samtidige beskeder ikke snyde sig forbi grænsen og give ekstra (betalte) kald.
        var saved = await chatMessageRepository.CreateChatMessageWithinLimitAsync(
            session.Id, ChatSender.User, message, interpreter.DetectIntent(message).ToString(), MaxMessagesPerSession);

        if (saved == OperationResult.NotFound)
        {
            return ChatReplyResult.Invalid("This chat has reached its limit. Please use the contact form to continue.");
        }

        if (saved != OperationResult.Success)
        {
            return ChatReplyResult.From(saved);
        }

        var response = await interpreter.InterpretMessageAsync(message, session.LanguageType, history, cancellationToken);

        // Svaret vises også, selvom det ikke kunne gemmes: den besøgende skal ikke mærke en databasefejl.
        if (await chatMessageRepository.CreateChatMessageAsync(session.Id, ChatSender.Bot, response.Text, null) != OperationResult.Success)
        {
            logger.LogWarning("Could not save the chatbot's answer for session {ChatSessionId}.", session.Id);
        }

        return ChatReplyResult.Success(response.Text);
    }

    public async Task<OperationResult> EndSessionAsync(Guid sessionToken) =>
        await chatSessionRepository.GetChatSessionByTokenAsync(sessionToken) is { } session
            ? await chatSessionRepository.EndChatSessionAsync(session.Id)
            : OperationResult.NotFound;

    public async Task<IReadOnlyList<ChatMessage>> GetSessionMessagesAsync(Guid sessionToken) =>
        await chatSessionRepository.GetChatSessionByTokenAsync(sessionToken) is { } session
            ? await chatMessageRepository.GetChatMessagesBySessionIdAsync(session.Id)
            : [];

    public async Task<ValidatedResult> ConvertChatToContactAsync(Guid sessionToken, string fullname, string email)
    {
        var session = await chatSessionRepository.GetChatSessionByTokenAsync(sessionToken);
        if (session is null)
        {
            return ValidatedResult.From(OperationResult.NotFound);
        }

        var messages = await chatMessageRepository.GetChatMessagesBySessionIdAsync(session.Id);
        if (!messages.Any(m => m.Sender == ChatSender.User))
        {
            return ValidatedResult.Invalid(["The chat is empty."]);
        }

        // Sessionen "låses" først, så to samtidige forsøg ikke begge opretter en henvendelse.
        var claim = await chatSessionRepository.ClaimChatSessionForContactAsync(session.Id);
        if (claim == OperationResult.NotFound)
        {
            return ValidatedResult.Invalid(["This chat has already been sent as an inquiry."]);
        }

        if (claim != OperationResult.Success)
        {
            return ValidatedResult.From(claim);
        }

        // Henvendelsen går gennem samme validering og gemning som kontaktformularen.
        var result = await contactService.SubmitContactFormAsync(new ContactFormInfo(fullname, email, Transcript(messages)));
        if (!result.IsSuccess || result.Id is not { } contactId)
        {
            // F.eks. ugyldig email: lås sessionen op igen, så den besøgende kan prøve igen.
            await chatSessionRepository.ReleaseChatSessionClaimAsync(session);
            return result;
        }

        if (await chatSessionRepository.UpdateChatSessionByContactAsync(session.Id, contactId) != OperationResult.Success)
        {
            // Henvendelsen er gemt, så den besøgende får stadig besked om, at den er modtaget.
            logger.LogWarning("Inquiry {ContactId} was saved, but could not be linked to chat session {ChatSessionId}.", contactId, session.Id);
        }

        return result;
    }

    public Task<IReadOnlyList<ChatSession>> GetSessionsAsync(DateTime fromDate, DateTime toDate) =>
        chatSessionRepository.GetChatSessionByDateRangeAsync(fromDate, toDate);

    public Task<IReadOnlyList<ChatMessage>> GetSessionMessagesByIdAsync(int chatSessionId) =>
        chatMessageRepository.GetChatMessagesBySessionIdAsync(chatSessionId);

    public Task<OperationResult> DeleteSessionAsync(int chatSessionId) =>
        chatSessionRepository.DeleteChatSessionByAllInfoAsync(new ChatSession { Id = chatSessionId });

    public Task<OperationResult> DeleteSessionsOlderThanAsync(int retentionDays) =>
        retentionDays < 1
            ? Task.FromResult(OperationResult.InvalidInput)
            : chatSessionRepository.DeleteChatSessionsOlderThanAsync(timeProvider.GetUtcNow().UtcDateTime.AddDays(-retentionDays));

    // Samtalen som tekst til henvendelsen. Holdes inden for kontaktformularens grænse for beskedlængde.
    internal static string Transcript(IReadOnlyList<ChatMessage> messages)
    {
        var builder = new StringBuilder("Chat transcript:\n");
        foreach (var message in messages)
        {
            builder.Append(message.Sender == ChatSender.User ? "Visitor: " : "Chatbot: ").AppendLine(message.Text);
        }

        var transcript = builder.ToString().TrimEnd();
        const int max = ContactFormLimits.MaxMessageLength;
        return transcript.Length <= max ? transcript : transcript[..(max - 1)] + "…";
    }
}
