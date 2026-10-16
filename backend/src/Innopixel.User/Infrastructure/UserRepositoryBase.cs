namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.User.Contracts.Enums;
using Npgsql;
using User = Innopixel.User.Domain.User;

public abstract class RepositoryBase(IDbConnectionFactory connectionFactory)
{
    // Fælles SELECT for alle opslag, der returnerer brugere. Slettede brugere udelades.
    protected const string SelectUsers = """
        SELECT u.*
        FROM "user" u
        JOIN name n ON n.id = u.name_id
        JOIN address a ON a.id = u.address_id
        JOIN telephone t ON t.id = u.telephone_id
        JOIN birth b ON b.id = u.birth_id
        WHERE u.deleted_at IS NULL
        """;

    protected IDbConnectionFactory ConnectionFactory { get; } = connectionFactory;

    protected async Task<IReadOnlyList<User>> QueryUsersAsync(string filter, object? param = null)
    {
        using var connection = ConnectionFactory.CreateConnection();
        var users = await connection.QueryAsync<User>($"{SelectUsers} AND {filter}", param);
        return users.AsList();
    }

    protected async Task<OperationResult> ExecuteAsync(string sql, object? param = null)
    {
        try
        {
            using var connection = ConnectionFactory.CreateConnection();
            var affected = await connection.ExecuteAsync(sql, param);
            return affected > 0 ? OperationResult.Success : OperationResult.NotFound;
        }
        catch (NpgsqlException)
        {
            return OperationResult.Failed;
        }
    }
}
