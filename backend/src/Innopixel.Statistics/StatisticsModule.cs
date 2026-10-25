namespace Innopixel.Statistics;

using Innopixel.Statistics.Application;
using Innopixel.Statistics.Application.Interfaces;
using Innopixel.Statistics.Contracts;
using Innopixel.Statistics.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

public static class StatisticsModule
{
    // Kræver, at AddInnopixelDatabase (Innopixel.Shared) er kaldt først.
    public static IServiceCollection AddStatisticsModule(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);

        services.AddScoped<ISystemLogRepository, SystemLogRepository>();
        services.AddScoped<IStatisticsService, StatisticsService>();

        return services;
    }
}
