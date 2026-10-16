namespace Innopixel.User.Contracts.Dtos;

public record UserInfo(
    string Firstname,
    string? Middlename,
    string Lastname,
    string? Email,
    string Streetname,
    string Housenumber,
    int Countrycode,
    long Phonenumber,
    DateTime Birthday,
    DateTime Birthmonth,
    DateTime Birthyear,
    int? LocationId);
