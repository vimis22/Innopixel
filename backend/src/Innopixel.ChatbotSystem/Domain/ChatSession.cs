namespace Innopixel.ChatbotSystem.Domain;

public class ChatSession
{
    public int Id { get; set; }

    // Hemmelig, tilfældig nøgle, som kun den besøgendes browser kender. Alle besøgendes kald sker med den,
    // så man ikke kan læse andres samtaler ved at gætte et fortløbende id.
    public Guid Token { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string Status { get; set; } = ChatSessionStatus.Active;
    public string LanguageType { get; set; } = "da";

    // Udfyldes, når samtalen er blevet til en henvendelse (CONTACT i User-modulet).
    public int? ContactId { get; set; }
}
