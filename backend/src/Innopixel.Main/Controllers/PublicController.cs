namespace Innopixel.Main.Controllers;

using Innopixel.Projects.Contracts;
using Microsoft.AspNetCore.Mvc;

// Indhold til den offentlige hjemmeside. ?lang=da|en (standard: da).
[ApiController]
[Route("api/public")]
public class PublicController(IPublicContentService content) : ControllerBase
{
    [HttpGet("projects")]
    public Task<IReadOnlyList<PublicProjectDto>> Projects([FromQuery] string? lang) => content.GetProjectsAsync(lang ?? "da");

    [HttpGet("services")]
    public Task<IReadOnlyList<PublicServiceDto>> Services([FromQuery] string? lang) => content.GetServicesAsync(lang ?? "da");
}
