namespace Innopixel.ChatbotSystem.Domain;

public class ChatMessage
{
    public int Id { get; set; }

    // "User" (den besøgende) eller "Bot", se ChatSender.
    public string Sender { get; set; } = ChatSender.User;

    public string Text { get; set; } = string.Empty;
    public DateTime SendTime { get; set; }

    // Den hensigt, interpreteren genkendte i den besøgendes besked.
    public string? Intent { get; set; }

    public int ChatSessionId { get; set; }
}
