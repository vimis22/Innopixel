namespace Innopixel.User.Domain;

public class Name
{
    public int Id { get; set; }
    public string Firstname { get; set; } = string.Empty;
    public string? Middlename { get; set; }
    public string Lastname { get; set; } = string.Empty;
}
