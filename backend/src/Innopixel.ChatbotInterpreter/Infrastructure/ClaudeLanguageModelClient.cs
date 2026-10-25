namespace Innopixel.ChatbotInterpreter.Infrastructure;

using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Models.Beta;
using Anthropic.Models.Beta.Messages;
using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Contracts.Dtos;
using Microsoft.Extensions.Logging;

// Kalder Claude via det officielle Anthropic SDK.
// Alle fejl giver null, så chatbotten falder tilbage til de faste regler i stedet for at fejle over for den besøgende.
public class ClaudeLanguageModelClient(
    AnthropicClient client,
    ClaudeOptions options,
    ILogger<ClaudeLanguageModelClient> logger) : ILanguageModelClient
{
    // Svarene er korte, men der skal være plads til modellens tænkning, så svaret ikke bliver afkortet.
    private const int MaxTokens = 16000;

    public bool IsAvailable => true;

    public async Task<string?> CompleteAsync(
        string systemPrompt,
        IReadOnlyList<ChatTurn> conversation,
        LanguageModelTask task,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await client.Beta.Messages.Create(
                new MessageCreateParams
                {
                    Model = options.Model,
                    MaxTokens = MaxTokens,
                    System = systemPrompt,
                    Messages = conversation
                        .Select(turn => new BetaMessageParam
                        {
                            Role = turn.FromVisitor ? Role.User : Role.Assistant,
                            Content = turn.Text
                        })
                        .ToList(),

                    // Chat skal være hurtig og billig; forslag må være lidt grundigere.
                    OutputConfig = new BetaOutputConfig
                    {
                        Effort = task == LanguageModelTask.Chat ? Effort.Low : Effort.Medium
                    },

                    // Afviser modellen en forespørgsel, besvarer API'et den med en passende fallback-model i samme kald.
                    Betas = [AnthropicBeta.ServerSideFallback2026_07_01],
                    Fallbacks = new Default()
                },
                cancellationToken: cancellationToken);

            if (response.StopReason == "refusal")
            {
                logger.LogInformation("Claude declined the request ({Category}).", response.StopDetails?.Category);
                return null;
            }

            // Et afkortet svar vises ikke, som om det var færdigt.
            if (response.StopReason == "max_tokens")
            {
                logger.LogWarning("Claude's answer was cut off at {MaxTokens} tokens.", MaxTokens);
                return null;
            }

            var text = string.Concat(response.Content.Select(block => block.TryPickText(out var t) ? t.Text : string.Empty)).Trim();
            return text.Length > 0 ? text : null;
        }
        catch (AnthropicRateLimitException ex)
        {
            logger.LogWarning(ex, "Claude rate limit reached.");
            return null;
        }
        catch (AnthropicUnauthorizedException ex)
        {
            logger.LogError(ex, "Claude rejected the API key. Check the Claude:ApiKey configuration.");
            return null;
        }
        catch (Anthropic5xxException ex)
        {
            logger.LogWarning(ex, "Claude is temporarily unavailable.");
            return null;
        }
        catch (AnthropicApiException ex)
        {
            logger.LogError(ex, "Claude rejected the request.");
            return null;
        }
        catch (AnthropicIOException ex)
        {
            logger.LogWarning(ex, "Could not reach Claude.");
            return null;
        }
        catch (AnthropicException ex)
        {
            // Øvrige SDK-fejl, f.eks. et svar, der ikke kunne læses.
            logger.LogError(ex, "Unexpected error from the Claude SDK.");
            return null;
        }
        catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            // Timeout i SDK'et (ikke en annullering fra kalderen).
            logger.LogWarning(ex, "The request to Claude timed out.");
            return null;
        }
    }
}
