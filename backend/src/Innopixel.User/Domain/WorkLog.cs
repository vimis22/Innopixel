namespace Innopixel.User.Domain;

public class WorkLog
{
    public int Id { get; set; }
    public string? Description { get; set; }
    public DateTime Date { get; set; }
    public DateTime Checkin { get; set; }
    public DateTime? Checkout { get; set; }
}
