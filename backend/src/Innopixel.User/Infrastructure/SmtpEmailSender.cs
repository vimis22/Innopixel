namespace Innopixel.User.Infrastructure;

using Innopixel.User.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

// SMTP delivery with MailKit. A failure throws, so the caller can report it; nothing is retried silently.
public sealed class SmtpEmailSender(EmailOptions options) : IEmailSender
{
    public bool IsConfigured => options.IsConfigured;

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("E-mail is not configured (Email:Smtp:Host and Email:FromAddress).");
        }

        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        mime.To.Add(new MailboxAddress(message.ToName, message.ToAddress));
        mime.Subject = message.Subject;
        mime.Body = new BodyBuilder { TextBody = message.TextBody, HtmlBody = message.HtmlBody }.ToMessageBody();

        var security = options.Smtp.Security switch
        {
            "SslOnConnect" => SecureSocketOptions.SslOnConnect,
            "None" => SecureSocketOptions.None,
            _ => SecureSocketOptions.StartTls
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(options.Smtp.Host, options.Smtp.Port, security, cancellationToken);
        if (!string.IsNullOrEmpty(options.Smtp.Username))
        {
            await client.AuthenticateAsync(options.Smtp.Username, options.Smtp.Password ?? string.Empty, cancellationToken);
        }

        await client.SendAsync(mime, cancellationToken);
        await client.DisconnectAsync(quit: true, cancellationToken);
    }
}
