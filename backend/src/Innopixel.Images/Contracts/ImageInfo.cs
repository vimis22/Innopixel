namespace Innopixel.Images.Contracts;

// Det, frontenden skal bruge for at vise et billede.
public record ImageInfo(int Id, int ProjectsId, string Url, string? AltText, int SortOrder);
