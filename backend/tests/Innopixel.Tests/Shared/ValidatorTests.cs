namespace Innopixel.Tests.Shared;

using Innopixel.Shared.Validation;

public class ValidatorTests
{
    [Theory]
    [InlineData("anna@innopixel.dk", true)]
    [InlineData("anna.hansen+test@sub.example.com", true)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData(null, false)]
    [InlineData("anna", false)]
    [InlineData("anna@", false)]
    [InlineData("Anna <anna@innopixel.dk>", false)]
    public void IsValidEmail(string? email, bool expected) =>
        Assert.Equal(expected, Validator.IsValidEmail(email));

    [Fact]
    public void Required_AddsErrorForBlankAndTooLongValues()
    {
        var errors = new List<string>();

        Validator.Required(errors, " ", "Name", 5);
        Validator.Required(errors, "123456", "Title", 5);
        Validator.Required(errors, "12345", "Ok", 5);

        Assert.Equal(["Name is required.", "Title must be at most 5 characters."], errors);
    }

    [Fact]
    public void Optional_AllowsNullButNotTooLong()
    {
        var errors = new List<string>();

        Validator.Optional(errors, null, "Address", 3);
        Validator.Optional(errors, "1234", "Address", 3);

        Assert.Equal(["Address must be at most 3 characters."], errors);
    }
}
