namespace Innopixel.Main.Controllers;

using Innopixel.Main.Infrastructure;
using Innopixel.Shared.Results;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

// Kontaktformularen på hjemmesiden (US-10, US-11).
[ApiController]
[Route("api/contact")]
public class ContactController(IContactService contactService) : ControllerBase
{
    public record ContactRequest(string? Name, string? Email, string? Message);

    // 201: henvendelsen er gemt. 400: valideringsfejl (errors). 500: kunne ikke gemmes.
    [HttpPost]
    [EnableRateLimiting(RateLimits.ContactForm)]
    public async Task<IActionResult> Submit(ContactRequest request)
    {
        var result = await contactService.SubmitContactFormAsync(
            new ContactFormInfo(request.Name ?? string.Empty, request.Email ?? string.Empty, request.Message ?? string.Empty));

        return result.Result switch
        {
            OperationResult.Success => StatusCode(StatusCodes.Status201Created),
            OperationResult.InvalidInput => BadRequest(new { errors = result.Errors }),
            _ => Problem("The inquiry could not be saved. Please try again later.")
        };
    }
}
