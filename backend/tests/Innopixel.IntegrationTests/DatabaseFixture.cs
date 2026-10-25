namespace Innopixel.IntegrationTests;

using Innopixel.ChatbotInterpreter;
using Innopixel.ChatbotSystem;
using Innopixel.Images;
using Innopixel.Images.Infrastructure;
using Innopixel.Pages;
using Innopixel.Projects;
using Innopixel.Shared;
using Innopixel.Statistics;
using Innopixel.User;
using Innopixel.Workspace;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

// Opretter en ny, midlertidig database, kører schema-scriptet og registrerer alle moduler som i Program.cs.
// Databasen slettes igen, når testene er færdige.
//
// Kræver miljøvariablen INNOPIXEL_TEST_CONNECTION med en forbindelse til en PostgreSQL-server og en bruger,
// der må oprette databaser, f.eks.:
//   Host=localhost;Port=5432;Username=postgres;Password=...
// Uden variablen springes testene over.
public sealed class DatabaseFixture : IAsyncLifetime
{
    public const string ConnectionVariable = "INNOPIXEL_TEST_CONNECTION";

    private readonly string _databaseName = $"innopixel_test_{Guid.NewGuid():N}";
    private ServiceProvider? _services;

    public static string? ServerConnectionString => Environment.GetEnvironmentVariable(ConnectionVariable);

    public string ImageRoot { get; } = Path.Combine(Path.GetTempPath(), $"innopixel-images-{Guid.NewGuid():N}");

    public IServiceProvider Services => _services ?? throw new InvalidOperationException("The database is not configured.");

    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        if (ServerConnectionString is null)
        {
            return;
        }

        await ExecuteOnServerAsync($"CREATE DATABASE {_databaseName}");

        var connectionString = new NpgsqlConnectionStringBuilder(ServerConnectionString) { Database = _databaseName }.ConnectionString;
        ConnectionString = connectionString;

        // Alle migrationer i rækkefølge (001_, 002_, ...), præcis som de køres mod den rigtige database.
        await using (var connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();
            foreach (var script in Directory.GetFiles(Path.Combine(AppContext.BaseDirectory, "database"), "*.sql").Order(StringComparer.Ordinal))
            {
                await using var command = new NpgsqlCommand(await File.ReadAllTextAsync(script), connection);
                await command.ExecuteNonQueryAsync();
            }
        }

        _services = new ServiceCollection()
            .AddLogging()
            .AddInnopixelDatabase(connectionString)
            .AddUserModule()
            .AddProjectsModule()
            .AddPagesModule()
            .AddImagesModule(new ImageStorageOptions { RootPath = ImageRoot })
            .AddStatisticsModule()
            .AddChatbotInterpreterModule()
            .AddChatbotSystemModule()
            .AddWorkspaceModule()
            .BuildServiceProvider(new ServiceProviderOptions { ValidateOnBuild = true, ValidateScopes = true });
    }

    public async Task DisposeAsync()
    {
        if (_services is not null)
        {
            await _services.DisposeAsync();
            NpgsqlConnection.ClearAllPools();
            await ExecuteOnServerAsync($"DROP DATABASE IF EXISTS {_databaseName} WITH (FORCE)");
        }

        if (Directory.Exists(ImageRoot))
        {
            Directory.Delete(ImageRoot, recursive: true);
        }
    }

    public T Get<T>() where T : notnull => Services.CreateScope().ServiceProvider.GetRequiredService<T>();

    // Til at tjekke databasens tilstand direkte i en test.
    public async Task<T?> ScalarAsync<T>(string sql, object? param = null)
    {
        await using var connection = new NpgsqlConnection(
            new NpgsqlConnectionStringBuilder(ServerConnectionString) { Database = _databaseName }.ConnectionString);
        return await Dapper.SqlMapper.ExecuteScalarAsync<T>(connection, sql, param);
    }

    private static async Task ExecuteOnServerAsync(string sql)
    {
        var builder = new NpgsqlConnectionStringBuilder(ServerConnectionString) { Database = "postgres" };
        await using var connection = new NpgsqlConnection(builder.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}

[CollectionDefinition(Name)]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>
{
    public const string Name = "Database";
}

// En test, der kun køres, når INNOPIXEL_TEST_CONNECTION er sat.
public sealed class DatabaseFactAttribute : FactAttribute
{
    public DatabaseFactAttribute()
    {
        if (DatabaseFixture.ServerConnectionString is null)
        {
            Skip = $"Set {DatabaseFixture.ConnectionVariable} to run the database tests.";
        }
    }
}
