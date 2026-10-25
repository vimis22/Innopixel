namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;
using User = Innopixel.User.Domain.User;

public class UserRepository(IDbConnectionFactory connectionFactory)
    : UserRepositoryBase(connectionFactory), IUserRepository
{
    public async Task<OperationResult> CreateUserAsync(UserInfo userInfo) =>
        await CreateUserAndGetIdAsync(userInfo) is null ? OperationResult.Failed : OperationResult.Success;

    // Opretter Name, Address, Telephone og Birth først, og derefter User - alt i én transaktion.
    public async Task<int?> CreateUserAndGetIdAsync(UserInfo userInfo)
    {
        int? userId = null;

        var result = await InTransactionAsync(async (connection, transaction) =>
        {
            var nameId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO name (firstname, middlename, lastname) VALUES (@Firstname, @Middlename, @Lastname) RETURNING id",
                userInfo, transaction);

            var addressId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO address (streetname, housenumber) VALUES (@Streetname, @Housenumber) RETURNING id",
                userInfo, transaction);

            var telephoneId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO telephone (countrycode, phonenumber) VALUES (@Countrycode, @Phonenumber) RETURNING id",
                userInfo, transaction);

            var birthId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO birth (birthday, birthmonth, birthyear) VALUES (@Birthday, @Birthmonth, @Birthyear) RETURNING id",
                userInfo, transaction);

            userId = await connection.ExecuteScalarAsync<int>(
                """
                INSERT INTO "user" (email, location_id, name_id, address_id, telephone_id, birth_id)
                VALUES (@Email, @LocationId, @NameId, @AddressId, @TelephoneId, @BirthId)
                RETURNING id
                """,
                new
                {
                    userInfo.Email,
                    userInfo.LocationId,
                    NameId = nameId,
                    AddressId = addressId,
                    TelephoneId = telephoneId,
                    BirthId = birthId
                },
                transaction);
        });

        return result == OperationResult.Success ? userId : null;
    }

    public Task<IReadOnlyList<User>> GetUserByIdAsync(int userId) =>
        QueryUsersAsync("u.id = @UserId", new { UserId = userId });

    public Task<IReadOnlyList<User>> GetUserByEmailAsync(string email) =>
        QueryUsersAsync("u.email = @Email", new { Email = email });

    public Task<OperationResult> UpdateUserByEmailAsync(User user, string email) =>
        ExecuteAsync(
            "UPDATE \"user\" SET email = @Email WHERE id = @Id AND deleted_at IS NULL",
            new { user.Id, Email = email });

    // Soft delete via DELETED_AT.
    public Task<OperationResult> DeleteUserByAllInfoAsync(User user) =>
        ExecuteAsync(
            "UPDATE \"user\" SET deleted_at = now() WHERE id = @Id AND deleted_at IS NULL",
            new { user.Id });

    public Task<OperationResult> AssignAdminRoleAsync(int userId) =>
        AssignRoleAsync("admin", userId);

    public Task<OperationResult> AssignClientRoleAsync(int userId) =>
        AssignRoleAsync("client", userId);

    public Task<OperationResult> RemoveAdminRoleAsync(int userId) =>
        ExecuteAsync(
            """
            WITH rights AS (DELETE FROM rightslist WHERE admin_id = @Id)
            DELETE FROM admin WHERE id = @Id
            """,
            new { Id = userId });

    public Task<OperationResult> RemoveClientRoleAsync(int userId) =>
        ExecuteAsync(
            """
            WITH projects AS (DELETE FROM clientlist WHERE client_id = @Id),
                 contacts AS (UPDATE contact SET client_id = NULL WHERE client_id = @Id)
            DELETE FROM client WHERE id = @Id
            """,
            new { Id = userId });

    public Task<Admin?> GetAdminByIdAsync(int adminId) =>
        QuerySingleAsync<Admin>(
            """
            SELECT u.*, a.message_id
            FROM admin a
            JOIN "user" u ON u.id = a.id
            WHERE a.id = @Id AND u.deleted_at IS NULL
            """,
            new { Id = adminId });

    public Task<Client?> GetClientByIdAsync(int clientId) =>
        QuerySingleAsync<Client>(
            """
            SELECT u.*
            FROM client c
            JOIN "user" u ON u.id = c.id
            WHERE c.id = @Id AND u.deleted_at IS NULL
            """,
            new { Id = clientId });

    // table er altid "admin" eller "client" (aldrig input fra brugeren).
    private Task<OperationResult> AssignRoleAsync(string table, int userId) =>
        ExecuteAsync(
            $"""
            INSERT INTO {table} (id)
            SELECT id FROM "user" WHERE id = @Id AND deleted_at IS NULL
            ON CONFLICT (id) DO NOTHING
            """,
            new { Id = userId });
}
