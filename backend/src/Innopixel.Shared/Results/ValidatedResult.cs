namespace Innopixel.Shared.Results;

// Resultat fra en service-operation, der validerer input.
// Errors er tom, medmindre Result er InvalidInput. Id er det oprettede objekts id, når det giver mening.
public record ValidatedResult(OperationResult Result, IReadOnlyList<string> Errors, int? Id = null)
{
    public bool IsSuccess => Result == OperationResult.Success;

    public static ValidatedResult Success(int? id = null) => new(OperationResult.Success, [], id);

    public static ValidatedResult Invalid(IReadOnlyList<string> errors) => new(OperationResult.InvalidInput, errors);

    public static ValidatedResult From(OperationResult result) => new(result, []);
}
