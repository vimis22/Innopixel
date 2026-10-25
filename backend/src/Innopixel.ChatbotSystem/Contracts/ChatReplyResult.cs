namespace Innopixel.ChatbotSystem.Contracts;

using Innopixel.Shared.Results;

// Resultatet af at sende en besked i chatten. Reply er chatbottens svar, når Result er Success.
public record ChatReplyResult(OperationResult Result, string? Reply, IReadOnlyList<string> Errors)
{
    public static ChatReplyResult Success(string reply) => new(OperationResult.Success, reply, []);

    public static ChatReplyResult Invalid(params string[] errors) => new(OperationResult.InvalidInput, null, errors);

    public static ChatReplyResult From(OperationResult result) => new(result, null, []);
}
