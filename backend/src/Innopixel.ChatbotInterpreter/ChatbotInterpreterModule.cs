namespace Innopixel.ChatbotInterpreter;

using Anthropic;
using Innopixel.ChatbotInterpreter.Application;
using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Contracts;
using Innopixel.ChatbotInterpreter.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

public static class ChatbotInterpreterModule
{
    // Kræver AddInnopixelDatabase og AddProjectsModule. Uden claudeOptions.ApiKey kører chatbotten på faste regler.
    public static IServiceCollection AddChatbotInterpreterModule(this IServiceCollection services, ClaudeOptions? claudeOptions = null)
    {
        var options = claudeOptions ?? new ClaudeOptions();

        if (options.IsConfigured)
        {
            services.AddSingleton(options);
            services.AddSingleton(new AnthropicClient { ApiKey = options.ApiKey });
            services.AddSingleton<ILanguageModelClient, ClaudeLanguageModelClient>();
        }
        else
        {
            services.AddSingleton<ILanguageModelClient, DisabledLanguageModelClient>();
        }

        services.AddScoped<IAiSuggestionRepository, AiSuggestionRepository>();
        services.AddScoped<IChatbotInterpreterService, ChatbotInterpreterService>();

        return services;
    }
}
