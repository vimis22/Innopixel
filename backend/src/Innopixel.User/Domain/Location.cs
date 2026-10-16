namespace Innopixel.User.Domain;

public class Location
{
    public int Id { get; set; }
    public string Postalcode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}
