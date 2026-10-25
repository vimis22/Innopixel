namespace Innopixel.Images.Domain;

// Et billede knyttet til et projekt (US-07).
public class Image
{
    public int Id { get; set; }

    // Peger på PROJECTS i Projects-modulet.
    public int ProjectsId { get; set; }

    // Navnet filen er gemt under (genereret af serveren, aldrig brugerens filnavn).
    public string FileName { get; set; } = string.Empty;

    public string? OriginalFileName { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }

    // Alternativ tekst til skærmlæsere og SEO.
    public string? AltText { get; set; }

    public int SortOrder { get; set; }
    public DateTime UploadedAt { get; set; }
}
