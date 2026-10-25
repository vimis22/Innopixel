namespace Innopixel.ChatbotInterpreter.Application;

using System.Text.RegularExpressions;
using Innopixel.ChatbotInterpreter.Domain;

// Simpel, nøgleordsbaseret genkendelse af hensigt (dansk og engelsk). Bruges altid, også når Claude svarer,
// så hensigten kan gemmes på beskeden og bruges til statistik.
internal static partial class IntentDetector
{
    // Rækkefølgen er prioriteten ved uafgjort: en besked om både services og kontakt behandles som kontakt.
    private static readonly (Intent Intent, string[] Keywords)[] Rules =
    [
        (Intent.Contact, ["kontakt", "kontakte", "email", "e-mail", "mail", "ring", "telefon", "tilbud", "pris", "priser",
                          "contact", "phone", "call", "quote", "price", "prices", "pricing", "reach"]),
        (Intent.AskAboutProjects, ["projekt", "projekter", "portfolio", "case", "cases", "eksempel", "eksempler", "referencer",
                                   "project", "projects", "example", "examples", "previous", "references"]),
        (Intent.AskAboutServices, ["service", "services", "ydelse", "ydelser", "tilbyder", "laver", "hjemmeside", "webshop", "app",
                                   "design", "udvikling", "offer", "website", "development", "develop"]),
        (Intent.AskAboutCompany, ["virksomhed", "erfaring", "historie", "team", "medarbejdere", "metode", "hvem",
                                  "company", "experience", "history", "about", "who", "method", "methods"])
    ];

    private static readonly string[] Greetings = ["hej", "hejsa", "goddag", "davs", "hello", "hi", "hey", "goodmorning"];

    public static Intent Detect(string text)
    {
        var words = WordPattern().Matches(text.ToLowerInvariant()).Select(m => m.Value).ToHashSet();
        if (words.Count == 0)
        {
            return Intent.Unknown;
        }

        var best = Intent.Unknown;
        var bestScore = 0;
        foreach (var (intent, keywords) in Rules)
        {
            var score = keywords.Count(words.Contains);
            if (score > bestScore)
            {
                best = intent;
                bestScore = score;
            }
        }

        if (best == Intent.Unknown && words.Overlaps(Greetings))
        {
            return Intent.Greeting;
        }

        return best;
    }

    [GeneratedRegex(@"[\p{L}\p{N}-]+")]
    private static partial Regex WordPattern();
}
