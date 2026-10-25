namespace Innopixel.Shared.Results;

// Fejltyper, som frontenden kender (RepositoryError i frontend/src/features/workspace/repository.ts).
public enum ServiceErrorCode
{
    Validation,
    Forbidden,
    NotFound
}

// En fejl, der må vises til brugeren. MessageKey peger på en tekst i frontendens tekstfil
// (f.eks. "team.validation.emailTaken" i frontend/src/i18n/app/da.ts), så teksterne kun findes ét sted.
// API'et oversætter den til 400 / 403 / 404.
public sealed class ServiceErrorException(ServiceErrorCode code, string messageKey) : Exception(messageKey)
{
    public ServiceErrorCode Code { get; } = code;
    public string MessageKey { get; } = messageKey;

    public static ServiceErrorException Validation(string messageKey) => new(ServiceErrorCode.Validation, messageKey);
    public static ServiceErrorException Forbidden() => new(ServiceErrorCode.Forbidden, "common.noAccess");
    public static ServiceErrorException NotFound() => new(ServiceErrorCode.NotFound, "errors.notFoundText");
}
