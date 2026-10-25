namespace Innopixel.Tests.Chatbot;

using Innopixel.ChatbotInterpreter.Contracts;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.ChatbotSystem.Application;
using Innopixel.ChatbotSystem.Application.Interfaces;
using Innopixel.ChatbotSystem.Domain;
using Innopixel.Shared.Results;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

public class ChatbotSystemTests
{
    private static readonly Guid Token = Guid.NewGuid();

    private readonly IChatSessionRepository _sessions = Substitute.For<IChatSessionRepository>();
    private readonly IChatMessageRepository _messages = Substitute.For<IChatMessageRepository>();
    private readonly IChatbotInterpreterService _interpreter = Substitute.For<IChatbotInterpreterService>();
    private readonly IContactService _contacts = Substitute.For<IContactService>();
    private readonly ChatbotSystemService _service;

    public ChatbotSystemTests()
    {
        _interpreter
            .InterpretMessageAsync(default!, default!, default!, default)
            .ReturnsForAnyArgs(new ChatbotResponse("Svar", Intent.AskAboutServices, false));
        _interpreter.DetectIntent(Arg.Any<string>()).Returns(Intent.AskAboutServices);
        _messages.CreateChatMessageAsync(default, default!, default!, default).ReturnsForAnyArgs(OperationResult.Success);
        _messages.CreateChatMessageWithinLimitAsync(default, default!, default!, default, default).ReturnsForAnyArgs(OperationResult.Success);
        _messages.GetChatMessagesBySessionIdAsync(Arg.Any<int>()).Returns([]);
        _sessions.ClaimChatSessionForContactAsync(Arg.Any<int>()).Returns(OperationResult.Success);
        _sessions.UpdateChatSessionByContactAsync(default, default).ReturnsForAnyArgs(OperationResult.Success);

        _service = new ChatbotSystemService(
            _sessions, _messages, _interpreter, _contacts, TimeProvider.System, NullLogger<ChatbotSystemService>.Instance);
    }

    [Fact]
    public async Task StartSession_ReturnsARandomToken_AndRejectsUnsupportedLanguage()
    {
        _sessions.CreateChatSessionAsync(Arg.Any<ChatSession>()).Returns(1);

        var started = await _service.StartSessionAsync("da");

        Assert.Equal(OperationResult.Success, started.Result);
        Assert.NotEqual(Guid.Empty, started.Token!.Value);
        await _sessions.Received(1).CreateChatSessionAsync(Arg.Is<ChatSession>(s => s.Token == started.Token));

        Assert.Equal(OperationResult.InvalidInput, (await _service.StartSessionAsync("de")).Result);
    }

    [Fact]
    public async Task SendMessage_WithUnknownToken_IsNotFound()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns((ChatSession?)null);

        Assert.Equal(OperationResult.NotFound, (await _service.SendMessageAsync(Token, "Hej")).Result);
    }

    [Fact]
    public async Task SendMessage_SavesQuestionBeforeAnswering_AndSavesTheAnswer()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns(new ChatSession { Id = 1, Token = Token, LanguageType = "da" });

        var result = await _service.SendMessageAsync(Token, "  Hvad tilbyder I?  ");

        Assert.Equal(OperationResult.Success, result.Result);
        Assert.Equal("Svar", result.Reply);
        Received.InOrder(() =>
        {
            _messages.CreateChatMessageWithinLimitAsync(1, ChatSender.User, "Hvad tilbyder I?", nameof(Intent.AskAboutServices), ChatbotSystemService.MaxMessagesPerSession);
            _interpreter.InterpretMessageAsync("Hvad tilbyder I?", "da", Arg.Any<IReadOnlyList<ChatTurn>>(), Arg.Any<CancellationToken>());
            _messages.CreateChatMessageAsync(1, ChatSender.Bot, "Svar", null);
        });
    }

    [Fact]
    public async Task SendMessage_ToEndedSession_IsRejected_WithoutCallingTheInterpreter()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns(new ChatSession { Id = 1, Status = ChatSessionStatus.Ended });

        var result = await _service.SendMessageAsync(Token, "Hej");

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _interpreter.DidNotReceiveWithAnyArgs().InterpretMessageAsync(default!, default!, default!, default);
    }

    [Fact]
    public async Task SendMessage_OverTheLimit_DoesNotCallTheInterpreter()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns(new ChatSession { Id = 1 });
        _messages.CreateChatMessageWithinLimitAsync(default, default!, default!, default, default).ReturnsForAnyArgs(OperationResult.NotFound);

        Assert.Equal(OperationResult.InvalidInput, (await _service.SendMessageAsync(Token, "Hej")).Result);
        Assert.Equal(OperationResult.InvalidInput, (await _service.SendMessageAsync(Token, new string('x', ChatbotSystemService.MaxMessageLength + 1))).Result);
        await _interpreter.DidNotReceiveWithAnyArgs().InterpretMessageAsync(default!, default!, default!, default);
    }

    [Fact]
    public async Task ConvertToContact_SendsTranscript_AndLinksTheSession()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns(new ChatSession { Id = 1 });
        _messages.GetChatMessagesBySessionIdAsync(1).Returns([
            new ChatMessage { Sender = ChatSender.User, Text = "Hvad koster en webshop?" },
            new ChatMessage { Sender = ChatSender.Bot, Text = "Skriv til os." }
        ]);
        _contacts.SubmitContactFormAsync(Arg.Any<ContactFormInfo>()).Returns(ValidatedResult.Success(5));

        var result = await _service.ConvertChatToContactAsync(Token, "Anna", "anna@innopixel.dk");

        Assert.True(result.IsSuccess);
        await _contacts.Received(1).SubmitContactFormAsync(Arg.Is<ContactFormInfo>(f =>
            f.Message.Contains("Visitor: Hvad koster en webshop?") && f.Message.Contains("Chatbot: Skriv til os.")));
        await _sessions.Received(1).UpdateChatSessionByContactAsync(1, 5);
    }

    [Fact]
    public async Task ConvertToContact_AlreadyClaimed_DoesNotCreateASecondInquiry()
    {
        _sessions.GetChatSessionByTokenAsync(Token).Returns(new ChatSession { Id = 1 });
        _messages.GetChatMessagesBySessionIdAsync(1).Returns([new ChatMessage { Sender = ChatSender.User, Text = "Hej" }]);
        _sessions.ClaimChatSessionForContactAsync(1).Returns(OperationResult.NotFound);

        var result = await _service.ConvertChatToContactAsync(Token, "Anna", "anna@innopixel.dk");

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _contacts.DidNotReceiveWithAnyArgs().SubmitContactFormAsync(default!);
    }

    [Fact]
    public async Task ConvertToContact_InvalidEmail_ReleasesTheClaim()
    {
        var session = new ChatSession { Id = 1 };
        _sessions.GetChatSessionByTokenAsync(Token).Returns(session);
        _messages.GetChatMessagesBySessionIdAsync(1).Returns([new ChatMessage { Sender = ChatSender.User, Text = "Hej" }]);
        _contacts.SubmitContactFormAsync(Arg.Any<ContactFormInfo>()).Returns(ValidatedResult.Invalid(["Email must be a valid email address."]));

        var result = await _service.ConvertChatToContactAsync(Token, "Anna", "anna");

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _sessions.Received(1).ReleaseChatSessionClaimAsync(session);
        await _sessions.DidNotReceiveWithAnyArgs().UpdateChatSessionByContactAsync(default, default);
    }
}
