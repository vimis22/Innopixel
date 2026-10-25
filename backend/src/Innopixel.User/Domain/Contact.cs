namespace Innopixel.User.Domain;

public class Contact
{
    public int Id { get; set; }
    public string Fullname { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Registration { get; set; }
    public int? ClientId { get; set; }
}
