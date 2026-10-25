namespace Innopixel.User.Application;

using System.Net;
using Innopixel.User.Application.Interfaces;

/*
 * The e-mails for reset links and invitations, as plain text and HTML (inline styles, as mail clients need).
 * They contain a link only, never a password. The token is in the URL fragment (#token=...), so browsers don't
 * send it to any server or put it in a Referer header.
 */
internal static class PasswordEmails
{
    public static EmailMessage Reset(string toAddress, string name, string link, int validMinutes) => Build(
        toAddress, name,
        subject: "Innopixel — Nulstil din adgangskode",
        heading: "Nulstil din adgangskode",
        intro: "Vi har modtaget en anmodning om at nulstille adgangskoden til din Innopixel-konto. Klik på knappen herunder, og vælg en ny adgangskode.",
        button: "Vælg ny adgangskode",
        link: link,
        validity: $"Linket er gyldigt i {validMinutes} minutter og kan kun bruges én gang.",
        outro: "Har du ikke bedt om at nulstille din adgangskode, kan du se bort fra denne e-mail. Din nuværende adgangskode virker stadig.");

    public static EmailMessage Invitation(string toAddress, string name, string link, int validHours) => Build(
        toAddress, name,
        subject: "Innopixel — Velkommen til Innopixel Studio",
        heading: "Velkommen til Innopixel Studio",
        intro: "Der er oprettet en konto til dig i Innopixel Studio, hvor vi planlægger projekter, opgaver og tid. Klik på knappen herunder, og vælg din adgangskode.",
        button: "Vælg adgangskode",
        link: link,
        validity: $"Linket er gyldigt i {validHours} timer og kan kun bruges én gang. Derefter logger du ind med din e-mailadresse.",
        outro: "Forventede du ikke denne e-mail, kan du se bort fra den.");

    private static EmailMessage Build(string toAddress, string name, string subject, string heading, string intro, string button, string link, string validity, string outro)
    {
        var greeting = $"Hej {name}";
        var text = $"""
            {greeting}

            {intro}

            {link}

            {validity}

            {outro}

            Venlig hilsen
            Innopixel
            """;

        string H(string value) => WebUtility.HtmlEncode(value);
        var html = $"""
            <!DOCTYPE html>
            <html lang="da">
            <body style="margin:0;padding:0;background:#0a0a0c;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;padding:32px 12px;">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141418;border:1px solid #26262c;border-radius:16px;">
                    <tr><td style="padding:28px 32px 0;">
                      <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.01em;"><span style="color:#ff6a2b;">&#9632;</span> innopixel</p>
                    </td></tr>
                    <tr><td style="padding:20px 32px 8px;">
                      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#ffffff;">{H(heading)}</h1>
                      <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#d4d4d8;">{H(greeting)},</p>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d4d4d8;">{H(intro)}</p>
                      <a href="{H(link)}" style="display:inline-block;padding:13px 26px;border-radius:999px;background:#ff6a2b;background-image:linear-gradient(135deg,#ff7a1a,#ff4d4d);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">{H(button)}</a>
                      <p style="margin:24px 0 8px;font-size:13px;line-height:1.6;color:#a1a1aa;">{H(validity)}</p>
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#a1a1aa;">Virker knappen ikke, så kopiér dette link ind i din browser:<br><span style="color:#ff8a4d;word-break:break-all;">{H(link)}</span></p>
                    </td></tr>
                    <tr><td style="padding:16px 32px 28px;border-top:1px solid #26262c;">
                      <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">{H(outro)}</p>
                      <p style="margin:12px 0 0;font-size:12px;color:#71717a;">Innopixel · Odense</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        return new EmailMessage(toAddress, name, subject, text, html);
    }
}
