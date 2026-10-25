namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public class LocationRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), ILocationRepository
{
    private const string SelectLocations = "SELECT * FROM location WHERE ";

    public Task<OperationResult> CreateLocationAsync(LocationInfo locationInfo) =>
        ExecuteAsync(
            "INSERT INTO location (postalcode, city, region, country) VALUES (@Postalcode, @City, @Region, @Country)",
            locationInfo);

    public Task<IReadOnlyList<Location>> GetLocationByIdAsync(int locationId) =>
        QueryLocationsAsync("id = @LocationId", new { LocationId = locationId });

    public Task<IReadOnlyList<Location>> GetLocationByFullAsync(string postalcode, string city, string region, string country) =>
        QueryLocationsAsync(
            "postalcode = @Postalcode AND city = @City AND region = @Region AND country = @Country",
            new { Postalcode = postalcode, City = city, Region = region, Country = country });

    public Task<IReadOnlyList<Location>> GetLocationByPostalcodeAsync(string postalcode) =>
        QueryLocationsAsync("postalcode = @Postalcode", new { Postalcode = postalcode });

    public Task<IReadOnlyList<Location>> GetLocationByCityAsync(string city) =>
        QueryLocationsAsync("city = @City", new { City = city });

    public Task<IReadOnlyList<Location>> GetLocationByRegionAsync(string region) =>
        QueryLocationsAsync("region = @Region", new { Region = region });

    public Task<IReadOnlyList<Location>> GetLocationByCountryAsync(string country) =>
        QueryLocationsAsync("country = @Country", new { Country = country });

    public Task<OperationResult> UpdateLocationByFullAsync(Location location, string postalcode, string city, string region, string country) =>
        ExecuteAsync(
            "UPDATE location SET postalcode = @Postalcode, city = @City, region = @Region, country = @Country WHERE id = @Id",
            new { location.Id, Postalcode = postalcode, City = city, Region = region, Country = country });

    public Task<OperationResult> UpdateLocationByPostalcodeAsync(Location location, string postalcode) =>
        ExecuteAsync("UPDATE location SET postalcode = @Postalcode WHERE id = @Id", new { location.Id, Postalcode = postalcode });

    public Task<OperationResult> UpdateLocationByCityAsync(Location location, string city) =>
        ExecuteAsync("UPDATE location SET city = @City WHERE id = @Id", new { location.Id, City = city });

    public Task<OperationResult> UpdateLocationByRegionAsync(Location location, string region) =>
        ExecuteAsync("UPDATE location SET region = @Region WHERE id = @Id", new { location.Id, Region = region });

    public Task<OperationResult> UpdateLocationByCountryAsync(Location location, string country) =>
        ExecuteAsync("UPDATE location SET country = @Country WHERE id = @Id", new { location.Id, Country = country });

    private async Task<IReadOnlyList<Location>> QueryLocationsAsync(string filter, object param)
    {
        using var connection = ConnectionFactory.CreateConnection();
        var locations = await connection.QueryAsync<Location>(SelectLocations + filter, param);
        return locations.AsList();
    }
}
