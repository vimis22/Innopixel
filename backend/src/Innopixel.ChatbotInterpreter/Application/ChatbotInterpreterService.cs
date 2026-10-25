namespace Innopixel.ChatbotInterpreter.Application;

using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Contracts;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.Projects.Contracts;
using Innopixel.Shared.Results;

public class ChatbotInterpreterService(
    ILanguageModelClient languageModel,
    IServicesService servicesService,
    IProjectsService projectsService,
    IAiSuggestionRepository aiSuggestionRepository) : IChatbotInterpreterService
{
    // Kun de seneste beskeder sendes med, så et langt chatforløb ikke bliver dyrt.
    public const int MaxHistoryTurns = 10;
    public const int MaxMessageLength = 1000;

    public bool IsLanguageModelAvailable => languageModel.IsAvailable;

    public Intent DetectIntent(string text) => IntentDetector.Detect(text);

    public async Task<ChatbotResponse> InterpretMessageAsync(
        string text,
        string languageType,
        IReadOnlyList<ChatTurn> history,
        CancellationToken cancellationToken = default)
    {
        var message = text.Length > MaxMessageLength ? text[..MaxMessageLength] : text;
        var intent = IntentDetector.Detect(message);
        var context = await CompanyContext.LoadAsync(servicesService, projectsService, languageType);

        if (languageModel.IsAvailable)
        {
            var conversation = BuildConversation(history, message);
            var answer = await languageModel.CompleteAsync(
                Prompts.Chat(context, languageType), conversation, LanguageModelTask.Chat, cancellationToken);

            if (answer is not null)
            {
                return new ChatbotResponse(answer, intent, UsedLanguageModel: true);
            }
        }

        return new ChatbotResponse(FallbackAnswers.For(intent, context, languageType), intent, UsedLanguageModel: false);
    }

    public async Task<ValidatedResult> GenerateSuggestionAsync(int projectId, string type, CancellationToken cancellationToken = default)
    {
        if (!AiSuggestionType.IsValid(type))
        {
            return ValidatedResult.Invalid([$"Type must be '{AiSuggestionType.SeoTitle}', '{AiSuggestionType.MetaDescription}' or '{AiSuggestionType.ProjectDescription}'."]);
        }

        if (!languageModel.IsAvailable)
        {
            return ValidatedResult.Invalid(["AI suggestions are not available because no Claude API key is configured."]);
        }

        var details = await projectsService.GetProjectDetailsAsync(projectId);
        if (details is null)
        {
            return ValidatedResult.From(OperationResult.NotFound);
        }

        var suggestion = await languageModel.CompleteAsync(
            Prompts.SuggestionSystem,
            [new ChatTurn(FromVisitor: true, Prompts.Suggestion(details, type, "da"))],
            LanguageModelTask.Suggestion,
            cancellationToken);

        if (suggestion is null)
        {
            return ValidatedResult.From(OperationResult.Failed);
        }

        var id = await aiSuggestionRepository.CreateAiSuggestionAsync(new AiSuggestion
        {
            Type = type,
            OriginalText = type == AiSuggestionType.ProjectDescription ? details.Project.Description : null,
            SuggestedText = Clean(suggestion, AiSuggestionType.MaxLength(type)),
            ProjectsId = projectId
        });

        return id is null ? ValidatedResult.From(OperationResult.Failed) : ValidatedResult.Success(id);
    }

    public Task<IReadOnlyList<AiSuggestion>> GetSuggestionsByProjectAsync(int projectId) =>
        aiSuggestionRepository.GetAiSuggestionsByProjectsIdAsync(projectId);

    public Task<IReadOnlyList<AiSuggestion>> GetPendingSuggestionsAsync() =>
        aiSuggestionRepository.GetAiSuggestionsByAcceptedAsync(null);

    public Task<OperationResult> SetSuggestionAcceptedAsync(int suggestionId, bool accepted) =>
        aiSuggestionRepository.UpdateAiSuggestionByAcceptedAsync(new AiSuggestion { Id = suggestionId }, accepted);

    public Task<OperationResult> DeleteSuggestionAsync(int suggestionId) =>
        aiSuggestionRepository.DeleteAiSuggestionByAllInfoAsync(new AiSuggestion { Id = suggestionId });

    // Messages API'et kræver, at samtalen starter med en besked fra brugeren og skifter mellem de to parter.
    internal static List<ChatTurn> BuildConversation(IReadOnlyList<ChatTurn> history, string message)
    {
        var turns = history
            .TakeLast(MaxHistoryTurns)
            .Where(turn => !string.IsNullOrWhiteSpace(turn.Text))
            .SkipWhile(turn => !turn.FromVisitor)
            .ToList();

        turns.Add(new ChatTurn(FromVisitor: true, message));

        // Slå beskeder fra samme part sammen, f.eks. hvis den besøgende har skrevet to gange i træk.
        var merged = new List<ChatTurn>();
        foreach (var turn in turns)
        {
            if (merged.Count > 0 && merged[^1].FromVisitor == turn.FromVisitor)
            {
                merged[^1] = merged[^1] with { Text = merged[^1].Text + "\n\n" + turn.Text };
            }
            else
            {
                merged.Add(turn);
            }
        }

        return merged;
    }

    // Fjerner citationstegn omkring svaret og afkorter ved et ordskifte, hvis modellen skrev for langt.
    internal static string Clean(string text, int maxLength)
    {
        var cleaned = text.Trim().Trim('"', '“', '”', '\'').Trim();
        if (cleaned.Length <= maxLength)
        {
            return cleaned;
        }

        var cut = cleaned[..maxLength];
        var lastSpace = cut.LastIndexOf(' ');
        return (lastSpace > maxLength / 2 ? cut[..lastSpace] : cut).TrimEnd(',', ';', ':', ' ', '-');
    }
}
