namespace Innopixel.Workspace;

using Innopixel.Workspace.Application;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Contracts;
using Innopixel.Workspace.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

public static class WorkspaceModule
{
    // Kræver AddInnopixelDatabase og AddUserModule.
    public static IServiceCollection AddWorkspaceModule(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);

        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();

        services.AddScoped<ITimeRegistrationRepository, TimeRegistrationRepository>();
        services.AddScoped<ITimeRegistrationService, TimeRegistrationService>();

        return services;
    }
}
