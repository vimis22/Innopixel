namespace Innopixel.User.Domain;

public class User
{
    public int Id { get; set; }

    // NOTE: EMAIL findes endnu ikke i USER-tabellen, men bruges af getUserByEmail/updateUserByEmail.
    public string? Email { get; set; }

    // Soft delete: en bruger er slettet, når DeletedAt har en værdi.
    public DateTime? DeletedAt { get; set; }

    public int? LocationId { get; set; }
    public int NameId { get; set; }
    public int? AddressId { get; set; }
    public int? TelephoneId { get; set; }
    public int? BirthId { get; set; }
}
