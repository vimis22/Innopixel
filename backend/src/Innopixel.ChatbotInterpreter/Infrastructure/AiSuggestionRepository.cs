namespace Innopixel.ChatbotInterpreter.Infrastructure;

using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class AiSuggestionRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IAiSuggestionRepository
{
    public Task<int?> CreateAiSuggestionAsync(AiSuggestion aiSuggestion) =>
        InsertReturningIdAsync(
            """
            INSERT INTO aisuggestion (type, originaltext, suggestedtext, accepted, createdat, projects_id)
            VALUES (@Type, @OriginalText, @SuggestedText, NULL, now(), @ProjectsId)
            RETURNING id
            """,
            aiSuggestion);

    public Task<AiSuggestion?> GetAiSuggestionByIdAsync(int aiSuggestionId) =>
        QuerySingleAsync<AiSuggestion>("SELECT * FROM aisuggestion WHERE id = @Id", new { Id = aiSuggestionId });

    public Task<IReadOnlyList<AiSuggestion>> GetAiSuggestionsByProjectsIdAsync(int projectsId) =>
        QueryAsync<AiSuggestion>(
            "SELECT * FROM aisuggestion WHERE projects_id = @ProjectsId ORDER BY createdat DESC",
            new { ProjectsId = projectsId });

    public Task<IReadOnlyList<AiSuggestion>> GetAiSuggestionsByAcceptedAsync(bool? accepted) =>
        QueryAsync<AiSuggestion>(
            "SELECT * FROM aisuggestion WHERE accepted IS NOT DISTINCT FROM @Accepted ORDER BY createdat DESC",
            new { Accepted = accepted });

    public Task<OperationResult> UpdateAiSuggestionByAcceptedAsync(AiSuggestion aiSuggestion, bool accepted) =>
        ExecuteAsync("UPDATE aisuggestion SET accepted = @Accepted WHERE id = @Id", new { aiSuggestion.Id, Accepted = accepted });

    public Task<OperationResult> DeleteAiSuggestionByAllInfoAsync(AiSuggestion aiSuggestion) =>
        ExecuteAsync("DELETE FROM aisuggestion WHERE id = @Id", new { aiSuggestion.Id });
}
