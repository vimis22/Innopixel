namespace Innopixel.Statistics.Domain;

// Audit-log over ændringer i systemet.
public class SystemLog
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;

    // Hvornår ændringen skete.
    public DateTime TimezoneStamp { get; set; }

    // Hvor i systemet ændringen skete (f.eks. "Projects" eller "Services"), derfor string og ikke timestamp.
    public string? ChangedLocationSystem { get; set; }
}
