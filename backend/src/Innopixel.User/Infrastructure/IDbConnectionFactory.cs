namespace Innopixel.User.Infrastructure;

using System.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
