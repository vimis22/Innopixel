namespace Innopixel.Tests.User;

using Innopixel.Shared.Results;
using Innopixel.User.Application;
using Innopixel.User.Contracts;

public class PasswordRulesTests
{
    [Theory]
    [InlineData("Stærk-Kode-2026", true)]
    [InlineData("Aa1!aaaaaa", true)]          // exactly 10 characters
    [InlineData("Aa1!aaaaa", false)]          // 9 characters
    [InlineData("alle-smaa-2026!", false)]    // no upper case
    [InlineData("ALLE-STORE-2026!", false)]   // no lower case
    [InlineData("Ingen-Tal-Her!", false)]     // no digit
    [InlineData("IngenSpecial2026", false)]   // no special character
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Policy_RequiresLengthAndFourKindsOfCharacters(string? password, bool expected)
    {
        Assert.Equal(expected, PasswordPolicy.IsStrongEnough(password));
    }

    [Fact]
    public void Policy_RejectsTooLongPasswords_WithTheFrontendsMessageKey()
    {
        var error = Assert.Throws<ServiceErrorException>(() => PasswordPolicy.Validate("Aa1!" + new string('x', 125)));
        Assert.Equal("settings.password.tooWeak", error.MessageKey);
    }

    [Fact]
    public void GeneratedPasswords_FollowThePolicy_AndAreNotRepeated()
    {
        var passwords = Enumerable.Range(0, 200).Select(_ => StaffService.GeneratePassword()).ToList();

        Assert.All(passwords, p => Assert.True(PasswordPolicy.IsStrongEnough(p), p));
        Assert.All(passwords, p => Assert.DoesNotContain(p, c => "0O1lI".Contains(c)));
        Assert.Equal(passwords.Count, passwords.Distinct().Count());
    }

    [Fact]
    public void ResetEmail_ContainsTheLinkAndValidity_AndEscapesTheName()
    {
        var mail = PasswordEmails.Reset("sara@innopixel.dk", "Sara <b>Nielsen</b>", "https://studio.innopixel.dk/nulstil-adgangskode#token=abc", 60);

        Assert.Equal("Innopixel — Nulstil din adgangskode", mail.Subject);
        Assert.Contains("https://studio.innopixel.dk/nulstil-adgangskode#token=abc", mail.TextBody);
        Assert.Contains("href=\"https://studio.innopixel.dk/nulstil-adgangskode#token=abc\"", mail.HtmlBody);
        Assert.Contains("60 minutter", mail.TextBody);
        Assert.Contains("Sara &lt;b&gt;Nielsen&lt;/b&gt;", mail.HtmlBody);
        Assert.DoesNotContain("<b>Nielsen</b>", mail.HtmlBody);
    }

    [Fact]
    public void Invitation_StatesItsLongerValidity()
    {
        var mail = PasswordEmails.Invitation("ida@innopixel.dk", "Ida Holm", "https://studio.innopixel.dk/nulstil-adgangskode#token=xyz", 72);

        Assert.Equal("Innopixel — Velkommen til Innopixel Studio", mail.Subject);
        Assert.Contains("72 timer", mail.HtmlBody);
    }
}
