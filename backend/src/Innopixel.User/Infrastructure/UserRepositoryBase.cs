namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using User = Innopixel.User.Domain.User;

// Basisklasse for repositories, der arbejder på en bruger og dens dele (Name, Address, Telephone, Birth).
public abstract class UserRepositoryBase(IDbConnectionFactory connectionFactory) : RepositoryBase(connectionFactory)
{
    // Fælles SELECT for alle opslag, der returnerer brugere. Slettede brugere udelades.
    protected const string SelectUsers = """
        SELECT u.*
        FROM "user" u
        JOIN name n ON n.id = u.name_id
        LEFT JOIN address a ON a.id = u.address_id
        LEFT JOIN telephone t ON t.id = u.telephone_id
        LEFT JOIN birth b ON b.id = u.birth_id
        WHERE u.deleted_at IS NULL
        """;

    protected Task<IReadOnlyList<User>> QueryUsersAsync(string filter, object? param = null) =>
        QueryAsync<User>($"{SelectUsers} AND {filter}", param);

    // Opdaterer en del af brugeren (f.eks. name) ud fra brugerens id.
    // Fremmednøglen slås op i databasen i stedet for at stole på f.eks. user.NameId fra kalderen,
    // og slettede brugere kan ikke opdateres. param skal indeholde Id (brugerens id).
    protected Task<OperationResult> UpdateUserPartAsync(string table, string foreignKeyColumn, string setClause, object param) =>
        ExecuteAsync(
            $"""
            UPDATE {table} p
            SET {setClause}
            FROM "user" u
            WHERE u.{foreignKeyColumn} = p.id AND u.id = @Id AND u.deleted_at IS NULL
            """,
            param);
}
