namespace Innopixel.Shared;

using Dapper;
using Innopixel.Shared.Data;
using Microsoft.Extensions.DependencyInjection;

public static class SharedModule
{
    // Kaldes én gang fra Program.cs, før modulerne registreres.
    public static IServiceCollection AddInnopixelDatabase(this IServiceCollection services, string connectionString)
    {
        // Mapper snake_case-kolonner (name_id) til PascalCase-properties (NameId).
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        services.AddSingleton<IDbConnectionFactory>(new DbConnectionFactory(connectionString));

        return services;
    }
}
