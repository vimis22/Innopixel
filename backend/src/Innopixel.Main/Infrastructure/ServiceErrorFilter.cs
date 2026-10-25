namespace Innopixel.Main.Infrastructure;

using Innopixel.Shared.Results;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

// Oversætter regel- og valideringsfejl fra services til HTTP-svar, som frontenden forstår:
// { "code": "VALIDATION" | "FORBIDDEN" | "NOT_FOUND", "messageKey": "<nøgle i frontendens da.ts>" }
public sealed class ServiceErrorFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not ServiceErrorException error)
        {
            return;
        }

        var (status, code) = error.Code switch
        {
            ServiceErrorCode.Forbidden => (StatusCodes.Status403Forbidden, "FORBIDDEN"),
            ServiceErrorCode.NotFound => (StatusCodes.Status404NotFound, "NOT_FOUND"),
            _ => (StatusCodes.Status400BadRequest, "VALIDATION")
        };

        context.Result = new ObjectResult(new { code, messageKey = error.MessageKey }) { StatusCode = status };
        context.ExceptionHandled = true;
    }
}
