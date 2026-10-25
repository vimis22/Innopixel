namespace Innopixel.User.Application;

using System.Text.RegularExpressions;

// Oversætter mellem frontendens felter (ét navn, ét telefonnummer som tekst) og databasens
// tabeller name (fornavn, mellemnavn, efternavn) og telephone (landekode, nummer).
internal static partial class StaffFormat
{
    public const int DefaultCountryCode = 45;

    // "Michael Lundorff Hansen" -> ("Michael", "Lundorff", "Hansen"). Ét ord bliver fornavnet.
    public static (string Firstname, string? Middlename, string Lastname) SplitName(string name)
    {
        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length switch
        {
            0 => (string.Empty, null, string.Empty),
            1 => (parts[0], null, string.Empty),
            2 => (parts[0], null, parts[1]),
            _ => (parts[0], string.Join(' ', parts[1..^1]), parts[^1])
        };
    }

    public static string JoinName(string firstname, string? middlename, string lastname) =>
        string.Join(' ', new[] { firstname, middlename, lastname }.Where(part => !string.IsNullOrWhiteSpace(part)));

    // Samme regel som frontenden (utils/validation.ts): cifre, mellemrum, +, - og parenteser, 6-20 tegn.
    public static bool IsValidPhone(string phone) => PhonePattern().IsMatch(phone);

    // "+45 60 12 34 56" -> (45, 60123456). Uden "+" antages et dansk nummer.
    public static (int Countrycode, long Phonenumber)? ParsePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        var trimmed = phone.Trim();
        var countrycode = DefaultCountryCode;
        var rest = trimmed;

        if (trimmed.StartsWith('+'))
        {
            var match = CountryCodePattern().Match(trimmed);
            if (!match.Success)
            {
                return null;
            }

            countrycode = int.Parse(match.Groups[1].Value);
            rest = trimmed[match.Length..];
        }

        var digits = new string(rest.Where(char.IsDigit).ToArray());
        return digits.Length is > 0 and <= 15 && long.TryParse(digits, out var number) && number > 0 && countrycode > 0
            ? (countrycode, number)
            : null;
    }

    // (45, 60123456) -> "+45 60 12 34 56". Danske 8-cifrede numre vises i par.
    public static string? FormatPhone(int? countrycode, long? phonenumber)
    {
        if (countrycode is null || phonenumber is null)
        {
            return null;
        }

        var digits = phonenumber.Value.ToString();
        var formatted = digits.Length == 8
            ? string.Join(' ', Enumerable.Range(0, 4).Select(i => digits.Substring(i * 2, 2)))
            : digits;

        return $"+{countrycode} {formatted}";
    }

    [GeneratedRegex(@"^[+\d][\d\s()-]{5,19}$")]
    private static partial Regex PhonePattern();

    // "+45 60..." eller "+45-60..." -> landekoden er cifrene frem til første skilletegn.
    [GeneratedRegex(@"^\+(\d{1,3})(?=[\s()-])")]
    private static partial Regex CountryCodePattern();
}
