namespace Innopixel.ChatbotInterpreter.Application;

using Innopixel.ChatbotInterpreter.Domain;

// Faste svar, når Claude ikke er konfigureret eller ikke svarede.
internal static class FallbackAnswers
{
    private const int MaxListedItems = 5;

    public static string For(Intent intent, CompanyContext context, string languageType)
    {
        var danish = languageType != "en";

        return intent switch
        {
            Intent.Greeting => danish
                ? "Hej! Jeg kan fortælle om Innopixels services og tidligere projekter. Hvad vil du gerne vide?"
                : "Hi! I can tell you about Innopixel's services and previous projects. What would you like to know?",

            Intent.AskAboutServices when context.Services.Count > 0 => danish
                ? $"Vi tilbyder bl.a.: {List(context.Services)}. Skriv gerne, hvis du vil høre mere om en af dem."
                : $"Our services include: {List(context.Services)}. Let me know if you'd like to hear more about one of them.",

            Intent.AskAboutProjects when context.Projects.Count > 0 => danish
                ? $"Nogle af vores tidligere projekter er: {List(context.Projects.Select(p => p.Name).ToList())}. Du kan se dem alle under Projekter."
                : $"Some of our previous projects are: {List(context.Projects.Select(p => p.Name).ToList())}. You can see them all under Projects.",

            Intent.Contact => danish
                ? "Du kan kontakte os via kontaktformularen, så vender vi tilbage hurtigst muligt. Du kan også skrive dit navn og din email her i chatten."
                : "You can reach us through the contact form, and we'll get back to you as soon as possible. You can also leave your name and email here in the chat.",

            _ => danish
                ? "Det er jeg ikke sikker på. Skriv gerne til os via kontaktformularen, så hjælper vi dig videre."
                : "I'm not sure about that. Please write to us through the contact form, and we'll help you further."
        };
    }

    private static string List(IReadOnlyList<string> items) =>
        string.Join(", ", items.Take(MaxListedItems).Select(item => item.Length > 80 ? item[..80].TrimEnd() + "…" : item));
}
