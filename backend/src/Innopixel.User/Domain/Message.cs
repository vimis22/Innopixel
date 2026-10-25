namespace Innopixel.User.Domain;

public class Message
{
    public int Id { get; set; }
    public bool Disabled { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime SendTime { get; set; }
    public int? ContactId { get; set; }
}
