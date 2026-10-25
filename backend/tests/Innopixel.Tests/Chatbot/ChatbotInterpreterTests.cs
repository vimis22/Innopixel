namespace Innopixel.Tests.Chatbot;

using Innopixel.ChatbotInterpreter.Application;
using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.ChatbotInterpreter.Infrastructure;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Contracts.Dtos;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using NSubstitute;

public class ChatbotInterpreterTests
{
    private readonly IServicesService _services = Substitute.For<IServicesService>();
    private readonly IProjectsService _projects = Substitute.For<IProjectsService>();
    private readonly IAiSuggestionRepository _suggestions = Substitute.For<IAiSuggestionRepository>();

    public ChatbotInterpreterTests()
    {
        _services.GetServicesAsync().Returns([
            new ServiceDetails(new Services { Id = 1, ProjectDescription = "Web development" },
                [new Languages { LanguageType = "da", Text = "Hjemmesider" }])
        ]);
        _projects.GetPublishedProjectsAsync().Returns([new Projects { Id = 1, Name = "Webshop til Bager Hansen" }]);
    }

    [Theory]
    [InlineData("Hvad tilbyder I?", Intent.AskAboutServices)]
    [InlineData("What services do you offer?", Intent.AskAboutServices)]
    [InlineData("Kan jeg se nogle af jeres projekter?", Intent.AskAboutProjects)]
    [InlineData("How can I contact you about a price?", Intent.Contact)]
    [InlineData("Hej", Intent.Greeting)]
    [InlineData("This is unrelated", Intent.Unknown)]
    [InlineData("", Intent.Unknown)]
    public void DetectIntent(string text, Intent expected) =>
        Assert.Equal(expected, IntentDetector.Detect(text));

    [Fact]
    public async Task WithoutApiKey_AnswersFromRules_UsingCompanyContent()
    {
        var service = CreateService(new DisabledLanguageModelClient());

        var response = await service.InterpretMessageAsync("Hvad tilbyder I?", "da", []);

        Assert.False(response.UsedLanguageModel);
        Assert.Equal(Intent.AskAboutServices, response.Intent);
        Assert.Contains("Hjemmesider", response.Text);
    }

    [Fact]
    public async Task LanguageModelAnswer_IsUsed_AndFailureFallsBackToRules()
    {
        var model = Substitute.For<ILanguageModelClient>();
        model.IsAvailable.Returns(true);
        model.CompleteAsync(default!, default!, default, default).ReturnsForAnyArgs("Vi laver hjemmesider.", (string?)null);
        var service = CreateService(model);

        var first = await service.InterpretMessageAsync("Hvad laver I?", "da", []);
        var second = await service.InterpretMessageAsync("Hvad laver I?", "da", []);

        Assert.True(first.UsedLanguageModel);
        Assert.Equal("Vi laver hjemmesider.", first.Text);
        Assert.False(second.UsedLanguageModel);
        Assert.False(string.IsNullOrWhiteSpace(second.Text));
    }

    [Fact]
    public async Task ChatPrompt_ContainsOnlyPublishedContent()
    {
        var model = Substitute.For<ILanguageModelClient>();
        model.IsAvailable.Returns(true);
        var service = CreateService(model);

        await service.InterpretMessageAsync("Hej", "en", []);

        await model.Received(1).CompleteAsync(
            Arg.Is<string>(prompt => prompt.Contains("Webshop til Bager Hansen") && prompt.Contains("English")),
            Arg.Any<IReadOnlyList<ChatTurn>>(),
            LanguageModelTask.Chat,
            Arg.Any<CancellationToken>());
        await _projects.DidNotReceive().GetAllProjectsAsync();
    }

    [Fact]
    public void BuildConversation_StartsWithVisitor_AndMergesConsecutiveTurns()
    {
        List<ChatTurn> history = [new(false, "Bot first"), new(true, "Q1"), new(false, "A1"), new(true, "Q2")];

        var conversation = ChatbotInterpreterService.BuildConversation(history, "Q3");

        Assert.Equal([true, false, true], conversation.Select(t => t.FromVisitor));
        Assert.Equal("Q2\n\nQ3", conversation[^1].Text);
    }

    [Theory]
    [InlineData("\"Moderne webshop\"", 70, "Moderne webshop")]
    [InlineData("En meget lang titel der fortsætter", 20, "En meget lang titel")]
    public void Clean_RemovesQuotes_AndCutsAtWordBoundary(string input, int max, string expected) =>
        Assert.Equal(expected, ChatbotInterpreterService.Clean(input, max));

    [Fact]
    public async Task Suggestions_WithoutApiKey_AreNotAvailable()
    {
        var result = await CreateService(new DisabledLanguageModelClient())
            .GenerateSuggestionAsync(1, AiSuggestionType.SeoTitle);

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _suggestions.DidNotReceiveWithAnyArgs().CreateAiSuggestionAsync(default!);
    }

    [Fact]
    public async Task Suggestion_IsSavedAsPending_WithinTheLengthLimit()
    {
        var model = Substitute.For<ILanguageModelClient>();
        model.IsAvailable.Returns(true);
        model.CompleteAsync(default!, default!, default, default).ReturnsForAnyArgs(new string('a', 50) + " " + new string('b', 50));
        _projects.GetProjectDetailsAsync(1).Returns(new ProjectDetails(new Projects { Id = 1, Name = "Webshop" }, [], [], null, []));
        _suggestions.CreateAiSuggestionAsync(Arg.Any<AiSuggestion>()).Returns(9);

        var result = await CreateService(model).GenerateSuggestionAsync(1, AiSuggestionType.SeoTitle);

        Assert.True(result.IsSuccess);
        await _suggestions.Received(1).CreateAiSuggestionAsync(Arg.Is<AiSuggestion>(s =>
            s.SuggestedText.Length <= AiSuggestionType.MaxLength(AiSuggestionType.SeoTitle) && s.Accepted == null));
    }

    private ChatbotInterpreterService CreateService(ILanguageModelClient model) =>
        new(model, _services, _projects, _suggestions);
}
