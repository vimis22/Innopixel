namespace Innopixel.Main.Controllers;

using System.Data.Common;
using Innopixel.Shared.Data;
using Microsoft.AspNetCore.Mvc;

// Viser, om backend kører og kan nå databasen.
[ApiController]
[Route("api/health")]
public class HealthController(IDbConnectionFactory connectionFactory) : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        try
        {
            using var connection = connectionFactory.CreateConnection();
            connection.Open();
            return Ok(new { status = "ok", database = "ok" });
        }
        catch (DbException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "degraded", database = "unreachable" });
        }
    }
}
