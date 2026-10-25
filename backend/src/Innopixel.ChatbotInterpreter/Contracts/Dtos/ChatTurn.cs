namespace Innopixel.ChatbotInterpreter.Contracts.Dtos;

// En tidligere besked i samtalen. FromVisitor = true for den besøgende, false for chatbotten.
public record ChatTurn(bool FromVisitor, string Text);
