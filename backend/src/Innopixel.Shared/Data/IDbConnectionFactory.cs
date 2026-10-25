namespace Innopixel.Shared.Data;

using System.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
