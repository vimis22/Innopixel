namespace Innopixel.Shared.Data;

using System.Data;
using System.Data.Common;
using Dapper;
using Innopixel.Shared.Results;

// Fælles regel for alle repositories:
// - Læsninger (Query*) lader databasefejl boble op som exceptions.
// - Skrivninger (Execute*, InTransaction*) fanger databasefejl og returnerer OperationResult.Failed.
public abstract class RepositoryBase(IDbConnectionFactory connectionFactory)
{
    protected IDbConnectionFactory ConnectionFactory { get; } = connectionFactory;

    protected async Task<IReadOnlyList<T>> QueryAsync<T>(string sql, object? param = null)
    {
        using var connection = ConnectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<T>(sql, param);
        return rows.AsList();
    }

    protected async Task<T?> QuerySingleAsync<T>(string sql, object? param = null)
    {
        using var connection = ConnectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<T>(sql, param);
    }

    // Success, hvis mindst én række blev påvirket, ellers NotFound.
    protected async Task<OperationResult> ExecuteAsync(string sql, object? param = null)
    {
        try
        {
            using var connection = ConnectionFactory.CreateConnection();
            var affected = await connection.ExecuteAsync(sql, param);
            return affected > 0 ? OperationResult.Success : OperationResult.NotFound;
        }
        catch (DbException)
        {
            return OperationResult.Failed;
        }
    }

    // Til INSERT ... RETURNING id. Returnerer det nye id, eller null hvis databasen afviser rækken.
    protected async Task<int?> InsertReturningIdAsync(string sql, object param)
    {
        try
        {
            using var connection = ConnectionFactory.CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, param);
        }
        catch (DbException)
        {
            return null;
        }
    }

    // Kører flere SQL-kald som én samlet operation.
    protected Task<OperationResult> InTransactionAsync(Func<IDbConnection, IDbTransaction, Task> work) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await work(connection, transaction);
            return OperationResult.Success;
        });

    // Committer kun, hvis work returnerer Success. Ellers rulles alt tilbage, når transaktionen disposes.
    protected async Task<OperationResult> InTransactionAsync(Func<IDbConnection, IDbTransaction, Task<OperationResult>> work)
    {
        try
        {
            using var connection = ConnectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            var result = await work(connection, transaction);
            if (result == OperationResult.Success)
            {
                transaction.Commit();
            }

            return result;
        }
        catch (DbException)
        {
            return OperationResult.Failed;
        }
    }
}
