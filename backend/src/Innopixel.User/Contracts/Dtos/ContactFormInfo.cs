namespace Innopixel.User.Contracts.Dtos;

// Input fra kontaktformularen på hjemmesiden (US-10).
public record ContactFormInfo(
    string Fullname,
    string Email,
    string Message,
    string? Address = null,
    string? Registration = null);
