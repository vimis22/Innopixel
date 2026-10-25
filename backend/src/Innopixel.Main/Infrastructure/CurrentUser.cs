namespace Innopixel.Main.Infrastructure;

using System.Globalization;
using System.Security.Claims;

public static class CurrentUser
{
    // Medarbejderens id fra login-cookien. Rolle og aktiv-status slås op i databasen ved hvert kald.
    public static int Id(ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), NumberStyles.None, CultureInfo.InvariantCulture, out var id)
            ? id
            : throw new InvalidOperationException("The request is not authenticated.");
}
