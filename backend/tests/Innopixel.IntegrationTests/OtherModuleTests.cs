namespace Innopixel.IntegrationTests;

using Innopixel.ChatbotInterpreter.Contracts;
using Innopixel.ChatbotSystem.Application;
using Innopixel.ChatbotSystem.Contracts;
using Innopixel.ChatbotSystem.Domain;
using Innopixel.Pages.Contracts;
using Innopixel.Pages.Domain;
using Innopixel.Shared.Results;
using Innopixel.Statistics.Contracts;
using Innopixel.User.Contracts;

[Collection(DatabaseCollection.Name)]
public class OtherModuleTests(DatabaseFixture db)
{
    [DatabaseFact]
    public async Task Page_IsHiddenUntilPublished_AndSlugIsUniquePerLanguage()
    {
        var pages = db.Get<IPagesService>();
        var slug = $"about-{Guid.NewGuid():N}";

        var created = await pages.CreatePageAsync(new Page { Slug = slug, LanguageType = "da", Title = "Om os", SeoTitle = "Om Innopixel" });
        Assert.True(created.IsSuccess);
        Assert.Null(await pages.GetPublishedPageAsync(slug, "da"));

        Assert.Equal(OperationResult.Success, await pages.SetPublishedAsync(created.Id!.Value, true));
        Assert.Equal("Om Innopixel", (await pages.GetPublishedPageAsync(slug, "da"))?.SeoTitle);
        Assert.Contains(await pages.GetIndexablePagesAsync(), p => p.Slug == slug);

        Assert.Equal(OperationResult.InvalidInput, (await pages.CreatePageAsync(new Page { Slug = slug, LanguageType = "da", Title = "Igen" })).Result);
        Assert.True((await pages.CreatePageAsync(new Page { Slug = slug, LanguageType = "en", Title = "About us" })).IsSuccess);

        Assert.True((await pages.UpdateSeoAsync(created.Id.Value, "Ny titel", "Ny beskrivelse")).IsSuccess);
        Assert.Equal("Ny beskrivelse", (await pages.GetPageByIdAsync(created.Id.Value))?.MetaDescription);
    }

    [DatabaseFact]
    public async Task SystemLog_IsWrittenAndCleanedUp()
    {
        var statistics = db.Get<IStatisticsService>();
        var location = $"Test-{Guid.NewGuid():N}"[..30];

        Assert.Equal(OperationResult.Success, await statistics.LogAsync("Project published", location));
        var log = Assert.Single(await statistics.GetLogsByLocationAsync(location));
        Assert.Contains(await statistics.GetLogsAsync(DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow.AddMinutes(5)), l => l.Id == log.Id);

        // Kun logs ældre end 1 dag slettes, så den nye log bliver.
        await statistics.DeleteLogsOlderThanAsync(1);
        Assert.Single(await statistics.GetLogsByLocationAsync(location));
    }

    [DatabaseFact]
    public async Task Chat_WorksThroughItsToken_AndBecomesAnInquiry()
    {
        var chat = db.Get<IChatbotSystemService>();

        var started = await chat.StartSessionAsync("da");
        Assert.Equal(OperationResult.Success, started.Result);
        var token = started.Token!.Value;

        // Uden Claude-nøgle svarer chatbotten ud fra de faste regler.
        var reply = await chat.SendMessageAsync(token, "Hej");
        Assert.Equal(OperationResult.Success, reply.Result);
        Assert.False(string.IsNullOrWhiteSpace(reply.Reply));
        Assert.Equal([ChatSender.User, ChatSender.Bot], (await chat.GetSessionMessagesAsync(token)).Select(m => m.Sender));

        // En ukendt token giver ingen adgang.
        Assert.Empty(await chat.GetSessionMessagesAsync(Guid.NewGuid()));
        Assert.Equal(OperationResult.NotFound, (await chat.SendMessageAsync(Guid.NewGuid(), "Hej")).Result);

        // Ugyldig email: sessionen låses op igen, så den besøgende kan prøve igen.
        Assert.Equal(OperationResult.InvalidInput, (await chat.ConvertChatToContactAsync(token, "Anna", "anna")).Result);
        var converted = await chat.ConvertChatToContactAsync(token, "Anna", "anna@innopixel.dk");
        Assert.True(converted.IsSuccess);
        Assert.Equal(OperationResult.InvalidInput, (await chat.ConvertChatToContactAsync(token, "Anna", "anna@innopixel.dk")).Result);

        var inquiry = Assert.Single(await db.Get<IContactService>().GetInquiriesByContactIdAsync(converted.Id!.Value));
        Assert.Contains("Visitor: Hej", inquiry.Description);

        // Henvendelsen er gemt, så samtalen er afsluttet.
        Assert.Equal(OperationResult.InvalidInput, (await chat.SendMessageAsync(token, "Er I der?")).Result);

        // GDPR-sletning af kontakten fjerner også samtalen.
        Assert.Equal(OperationResult.Success, await db.Get<IContactService>().DeleteContactAsync(converted.Id.Value));
        Assert.Empty(await chat.GetSessionMessagesAsync(token));
    }

    [DatabaseFact]
    public async Task Chat_StopsAtTheMessageLimit()
    {
        var chat = db.Get<IChatbotSystemService>();
        var token = (await chat.StartSessionAsync("en")).Token!.Value;

        for (var i = 0; i < ChatbotSystemService.MaxMessagesPerSession / 2; i++)
        {
            Assert.Equal(OperationResult.Success, (await chat.SendMessageAsync(token, $"Question {i}")).Result);
        }

        Assert.Equal(OperationResult.InvalidInput, (await chat.SendMessageAsync(token, "One more")).Result);
        Assert.Equal(ChatbotSystemService.MaxMessagesPerSession, (await chat.GetSessionMessagesAsync(token)).Count);
    }

    [DatabaseFact]
    public async Task Interpreter_WithoutApiKey_ReportsSuggestionsAsUnavailable()
    {
        var interpreter = db.Get<IChatbotInterpreterService>();

        Assert.False(interpreter.IsLanguageModelAvailable);
        Assert.Empty(await interpreter.GetSuggestionsByProjectAsync(-1));
        Assert.Equal(OperationResult.InvalidInput, (await interpreter.GenerateSuggestionAsync(-1, "SeoTitle")).Result);
    }
}
