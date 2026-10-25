namespace Innopixel.Shared.Data;

using System.Data;
using Npgsql;

public class DbConnectionFactory(string connectionString) : IDbConnectionFactory
{
    public IDbConnection CreateConnection() => new NpgsqlConnection(connectionString);
}
