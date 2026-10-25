namespace Innopixel.Projects.Domain;

public class Projects
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? Deadline { get; set; }

    // Draft eller Published (se ProjectStatus). Styrer, om projektet vises og indekseres (US-17, US-19).
    public string CurrentStatus { get; set; } = ProjectStatus.Draft;

    public int? ProgressId { get; set; }
}
