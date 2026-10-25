namespace Innopixel.IntegrationTests;

using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;

internal static class TestData
{
    public static UserInfo User(string? email = null, string firstname = "Anna") => new(
        firstname, null, "Hansen", email,
        "Vestergade", "12", 45, 12345678,
        new DateTime(1990, 5, 17, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(1990, 5, 1, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        null);

    public static string UniqueEmail() => $"{Guid.NewGuid():N}@innopixel.dk";

    public static async Task<int> CreateUserAsync(DatabaseFixture db, string? email = null) =>
        await db.Get<IUserRepository>().CreateUserAndGetIdAsync(User(email ?? UniqueEmail()))
        ?? throw new InvalidOperationException("Could not create test user.");
}
