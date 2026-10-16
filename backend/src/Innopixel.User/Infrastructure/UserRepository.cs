namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Contracts.Enums;
using Npgsql;
using User = Innopixel.User.Domain.User;

public class UserRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IUserRepository
{
    // Opretter Name, Address, Telephone og Birth først, og derefter User - alt i én transaktion.
    public async Task<OperationResult> CreateUserAsync(UserInfo userInfo)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
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

            await connection.ExecuteAsync(
                """
                INSERT INTO "user" (email, location_id, name_id, address_id, telephone_id, birth_id)
                VALUES (@Email, @LocationId, @NameId, @AddressId, @TelephoneId, @BirthId)
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

            transaction.Commit();
            return OperationResult.Success;
        }
        catch (NpgsqlException)
        {
            transaction.Rollback();
            return OperationResult.Failed;
        }
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
}
