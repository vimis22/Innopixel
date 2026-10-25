namespace Innopixel.User.Domain;

public class Rights
{
    public int Id { get; set; }
    public bool Create { get; set; }
    public bool Read { get; set; }
    public bool Update { get; set; }
    public bool Delete { get; set; }
}
