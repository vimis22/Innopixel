namespace Innopixel.Projects.Domain;

// En tekst på et bestemt sprog (US-18). Description er en nøgle/beskrivelse af, hvad teksten er (f.eks. "title").
public class Languages
{
    public int Id { get; set; }
    public string? Description { get; set; }
    public string LanguageType { get; set; } = LanguageTypes.Danish;
    public string Text { get; set; } = string.Empty;
}
