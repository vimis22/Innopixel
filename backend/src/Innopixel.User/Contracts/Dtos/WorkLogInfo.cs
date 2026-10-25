namespace Innopixel.User.Contracts.Dtos;

// UserId er valgfri: når den er sat, kobles worklog'en til brugeren via WORKLOGLIST i samme transaktion.
public record WorkLogInfo(
    string? Description,
    DateTime Date,
    DateTime Checkin,
    DateTime? Checkout,
    int? UserId);
