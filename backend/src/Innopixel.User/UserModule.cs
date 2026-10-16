namespace Innopixel.User;

using Dapper;
using Innopixel.User.Application;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public static class UserModule
{
    public static IServiceCollection AddUserModule(this IServiceCollection services, string connectionString)
    {
        // Mapper snake_case-kolonner (name_id) til PascalCase-properties (NameId).
        DefaultTypeMap.MatchNamesWithUnderscores = true;

        services.AddSingleton<IDbConnectionFactory>(new DbConnectionFactory(connectionString));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserNameRepository, UserNameRepository>();
        services.AddScoped<IUserAddressRepository, UserAddressRepository>();
        services.AddScoped<IUserTelephoneRepository, UserTelephoneRepository>();
        services.AddScoped<IUserBirthRepository, UserBirthRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IUserLocationRepository, UserLocationRepository>();

        services.AddScoped<IUserService, UserService>();

        return services;
    }
}
