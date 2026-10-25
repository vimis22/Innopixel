namespace Innopixel.Projects.Domain;

public class Progress
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime? ChangedAt { get; set; }

    // Hvem ændringen er lavet af (et navn eller en email), derfor string og ikke timestamp.
    public string? ChangedBy { get; set; }

    public int? ProjectsId { get; set; }
}
