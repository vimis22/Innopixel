namespace Innopixel.Images;

using Innopixel.Images.Application;
using Innopixel.Images.Application.Interfaces;
using Innopixel.Images.Contracts;
using Innopixel.Images.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public static class ImagesModule
{
    // Kræver, at AddInnopixelDatabase (Innopixel.Shared) er kaldt først.
    public static IServiceCollection AddImagesModule(this IServiceCollection services, ImageStorageOptions? storageOptions = null)
    {
        services.AddSingleton(storageOptions ?? new ImageStorageOptions());
        services.AddSingleton<IImageStorage, LocalImageStorage>();

        services.AddScoped<IImageRepository, ImageRepository>();
        services.AddScoped<IImagesService, ImagesService>();

        return services;
    }
}
