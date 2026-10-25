namespace Innopixel.Pages;

using Innopixel.Pages.Application;
using Innopixel.Pages.Application.Interfaces;
using Innopixel.Pages.Contracts;
using Innopixel.Pages.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public static class PagesModule
{
    // Kræver, at AddInnopixelDatabase (Innopixel.Shared) er kaldt først.
    public static IServiceCollection AddPagesModule(this IServiceCollection services)
    {
        services.AddScoped<IPageRepository, PageRepository>();
        services.AddScoped<IPagesService, PagesService>();

        return services;
    }
}
