namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

// "create", "read", "update" og "delete" står i anførselstegn, fordi de er reserverede ord i PostgreSQL.
public class RightsRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IRightsRepository
{
    private const string SelectRights = "SELECT * FROM rights WHERE ";

    public Task<OperationResult> CreateRightsAsync(Rights rightsInfo) =>
        ExecuteAsync(
            "INSERT INTO rights (\"create\", \"read\", \"update\", \"delete\") VALUES (@Create, @Read, @Update, @Delete)",
            rightsInfo);

    public Task<IReadOnlyList<Rights>> GetRightsByIdAsync(int rightsId) =>
        QueryAsync<Rights>(SelectRights + "id = @RightsId", new { RightsId = rightsId });

    public Task<IReadOnlyList<Rights>> GetRightsByAllInfoAsync(bool create, bool read, bool update, bool delete) =>
        QueryAsync<Rights>(
            SelectRights + "\"create\" = @Create AND \"read\" = @Read AND \"update\" = @Update AND \"delete\" = @Delete",
            new { Create = create, Read = read, Update = update, Delete = delete });

    public Task<IReadOnlyList<Rights>> GetRightsByCreateAsync(bool create) =>
        QueryAsync<Rights>(SelectRights + "\"create\" = @Create", new { Create = create });

    public Task<IReadOnlyList<Rights>> GetRightsByReadAsync(bool read) =>
        QueryAsync<Rights>(SelectRights + "\"read\" = @Read", new { Read = read });

    public Task<IReadOnlyList<Rights>> GetRightsByUpdateAsync(bool update) =>
        QueryAsync<Rights>(SelectRights + "\"update\" = @Update", new { Update = update });

    public Task<IReadOnlyList<Rights>> GetRightsByDeleteAsync(bool delete) =>
        QueryAsync<Rights>(SelectRights + "\"delete\" = @Delete", new { Delete = delete });

    public Task<OperationResult> UpdateRightsByFullAsync(Rights rights, bool create, bool read, bool update, bool delete) =>
        ExecuteAsync(
            "UPDATE rights SET \"create\" = @Create, \"read\" = @Read, \"update\" = @Update, \"delete\" = @Delete WHERE id = @Id",
            new { rights.Id, Create = create, Read = read, Update = update, Delete = delete });

    public Task<OperationResult> UpdateRightsByCreateAsync(Rights rights, bool create) =>
        ExecuteAsync("UPDATE rights SET \"create\" = @Create WHERE id = @Id", new { rights.Id, Create = create });

    public Task<OperationResult> UpdateRightsByReadAsync(Rights rights, bool read) =>
        ExecuteAsync("UPDATE rights SET \"read\" = @Read WHERE id = @Id", new { rights.Id, Read = read });

    public Task<OperationResult> UpdateRightsByUpdateAsync(Rights rights, bool update) =>
        ExecuteAsync("UPDATE rights SET \"update\" = @Update WHERE id = @Id", new { rights.Id, Update = update });

    public Task<OperationResult> UpdateRightsByDeleteAsync(Rights rights, bool delete) =>
        ExecuteAsync("UPDATE rights SET \"delete\" = @Delete WHERE id = @Id", new { rights.Id, Delete = delete });

    // Fjerner også rettighedens koblinger i RIGHTSLIST og SERVICELIST i samme SQL-sætning.
    public Task<OperationResult> DeleteRightsByAllInfoAsync(Rights rights) =>
        ExecuteAsync(
            """
            WITH admin_links AS (DELETE FROM rightslist WHERE rights_id = @Id),
                 service_links AS (DELETE FROM servicelist WHERE rights_id = @Id)
            DELETE FROM rights WHERE id = @Id
            """,
            new { rights.Id });

    // Alle rettigheder, en (ikke-slettet) admin har via RIGHTSLIST.
    public Task<IReadOnlyList<Rights>> GetRightsByAdminIdAsync(int adminId) =>
        QueryAsync<Rights>(
            """
            SELECT r.*
            FROM rights r
            JOIN rightslist rl ON rl.rights_id = r.id
            JOIN "user" u ON u.id = rl.admin_id
            WHERE rl.admin_id = @AdminId AND u.deleted_at IS NULL
            """,
            new { AdminId = adminId });

    // De rettigheder, en admin har, som gælder for en bestemt service via SERVICELIST.
    public Task<IReadOnlyList<Rights>> GetRightsByAdminIdAndServiceIdAsync(int adminId, int serviceId) =>
        QueryAsync<Rights>(
            """
            SELECT r.*
            FROM rights r
            JOIN rightslist rl ON rl.rights_id = r.id
            JOIN servicelist sl ON sl.rights_id = r.id
            JOIN "user" u ON u.id = rl.admin_id
            WHERE rl.admin_id = @AdminId AND sl.services_id = @ServicesId AND u.deleted_at IS NULL
            """,
            new { AdminId = adminId, ServicesId = serviceId });
}
