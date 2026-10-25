namespace Innopixel.User;

using Innopixel.User.Application;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

public static class UserModule
{
    // Kræver, at AddInnopixelDatabase (Innopixel.Shared) er kaldt først.
    // email: konfigurationssektionen "Email" (se EmailOptions). Uden den er e-mail slået fra.
    public static IServiceCollection AddUserModule(this IServiceCollection services, EmailOptions? email = null)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserNameRepository, UserNameRepository>();
        services.AddScoped<IUserAddressRepository, UserAddressRepository>();
        services.AddScoped<IUserTelephoneRepository, UserTelephoneRepository>();
        services.AddScoped<IUserBirthRepository, UserBirthRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IUserLocationRepository, UserLocationRepository>();

        services.AddScoped<IRightsRepository, RightsRepository>();
        services.AddScoped<IRightsListRepository, RightsListRepository>();
        services.AddScoped<IServiceListRepository, ServiceListRepository>();

        services.AddScoped<IContactRepository, ContactRepository>();
        services.AddScoped<IClientContactRepository, ClientContactRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IAdminMessageRepository, AdminMessageRepository>();
        services.AddScoped<IContactMessageRepository, ContactMessageRepository>();

        services.AddScoped<IWorkLogRepository, WorkLogRepository>();
        services.AddScoped<IWorkLogListRepository, WorkLogListRepository>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IAccessService, AccessService>();

        services.AddSingleton<IPasswordHasher<StaffMember>, PasswordHasher<StaffMember>>();
        services.AddScoped<IStaffRepository, StaffRepository>();
        services.AddScoped<IStaffService, StaffService>();
        services.AddScoped<IStaffAuthenticationService, AuthenticationService>();

        // Adgangskoder: midlertidige adgangskoder, nulstillingslinks og invitationer
        var emailOptions = email ?? new EmailOptions();
        services.TryAddSingleton(TimeProvider.System);
        services.AddSingleton(emailOptions);
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton(PasswordLinkSettings.Default(emailOptions.PublicBaseUrl));
        services.AddScoped<IPasswordTokenRepository, PasswordTokenRepository>();
        services.AddScoped<IPasswordService, PasswordService>();

        return services;
    }
}
