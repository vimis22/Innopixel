namespace Innopixel.Projects;

using Innopixel.Projects.Application;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public static class ProjectsModule
{
    // Kræver, at AddInnopixelDatabase (Innopixel.Shared) er kaldt først.
    public static IServiceCollection AddProjectsModule(this IServiceCollection services)
    {
        services.AddScoped<IProjectsRepository, ProjectsRepository>();
        services.AddScoped<IProgressRepository, ProgressRepository>();
        services.AddScoped<ITechnologyRepository, TechnologyRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IServicesRepository, ServicesRepository>();
        services.AddScoped<ILanguagesRepository, LanguagesRepository>();

        services.AddScoped<IProjectListRepository, ProjectListRepository>();
        services.AddScoped<ITechnologyListRepository, TechnologyListRepository>();
        services.AddScoped<ICategoryListRepository, CategoryListRepository>();
        services.AddScoped<ILanguageListRepository, LanguageListRepository>();
        services.AddScoped<IClientListRepository, ClientListRepository>();

        services.AddScoped<IProjectsService, ProjectsService>();
        services.AddScoped<IServicesService, ServicesService>();
        services.AddScoped<ITechnologyService, TechnologyService>();
        services.AddScoped<ICategoryService, CategoryService>();

        services.AddScoped<IPublicContentRepository, PublicContentRepository>();
        services.AddScoped<IPublicContentService, PublicContentService>();

        return services;
    }
}
