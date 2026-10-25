namespace Innopixel.User.Application.Interfaces;

public record EmailMessage(string ToAddress, string ToName, string Subject, string TextBody, string HtmlBody);

// Sends e-mail through the configured SMTP server (Infrastructure/SmtpEmailSender.cs).
public interface IEmailSender
{
    // False when no SMTP server and sender address are configured; nothing can be sent then.
    bool IsConfigured { get; }

    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}
