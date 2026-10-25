namespace Innopixel.ChatbotSystem;

using Innopixel.ChatbotSystem.Application;
using Innopixel.ChatbotSystem.Application.Interfaces;
using Innopixel.ChatbotSystem.Contracts;
using Innopixel.ChatbotSystem.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

public static class ChatbotSystemModule
{
    // Kræver AddInnopixelDatabase, AddUserModule og AddChatbotInterpreterModule.
    public static IServiceCollection AddChatbotSystemModule(this IServiceCollection services)
    {
        services.TryAddSingleton(TimeProvider.System);

        services.AddScoped<IChatSessionRepository, ChatSessionRepository>();
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
        services.AddScoped<IChatbotSystemService, ChatbotSystemService>();

        return services;
    }
}
