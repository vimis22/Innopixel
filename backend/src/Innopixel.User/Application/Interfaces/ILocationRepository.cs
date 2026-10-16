namespace Innopixel.User.Application.Interfaces;

using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Contracts.Enums;
using Innopixel.User.Domain;

// Ingen delete: en Location er forbundet med brugeren.
public interface ILocationRepository
{
    Task<OperationResult> CreateLocationAsync(LocationInfo locationInfo);

    Task<IReadOnlyList<Location>> GetLocationByIdAsync(int locationId);
    Task<IReadOnlyList<Location>> GetLocationByFullAsync(string postalcode, string city, string region, string country);
    Task<IReadOnlyList<Location>> GetLocationByPostalcodeAsync(string postalcode);
    Task<IReadOnlyList<Location>> GetLocationByCityAsync(string city);
    Task<IReadOnlyList<Location>> GetLocationByRegionAsync(string region);
    Task<IReadOnlyList<Location>> GetLocationByCountryAsync(string country);

    Task<OperationResult> UpdateLocationByFullAsync(Location location, string postalcode, string city, string region, string country);
    Task<OperationResult> UpdateLocationByPostalcodeAsync(Location location, string postalcode);
    Task<OperationResult> UpdateLocationByCityAsync(Location location, string city);
    Task<OperationResult> UpdateLocationByRegionAsync(Location location, string region);
    Task<OperationResult> UpdateLocationByCountryAsync(Location location, string country);
}
