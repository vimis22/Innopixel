namespace Innopixel.ChatbotSystem.Contracts;

using Innopixel.Shared.Results;

// Token er sessionens hemmelige nøgle. Frontenden gemmer den og sender den med i alle chatkald.
public record ChatSessionStartResult(OperationResult Result, Guid? Token, IReadOnlyList<string> Errors)
{
    public static ChatSessionStartResult Success(Guid token) => new(OperationResult.Success, token, []);

    public static ChatSessionStartResult Invalid(params string[] errors) => new(OperationResult.InvalidInput, null, errors);

    public static ChatSessionStartResult From(OperationResult result) => new(result, null, []);
}
