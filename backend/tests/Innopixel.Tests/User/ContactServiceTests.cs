namespace Innopixel.Tests.User;

using Innopixel.Shared.Results;
using Innopixel.User.Application;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using NSubstitute;

public class ContactServiceTests
{
    private readonly IContactMessageRepository _contactMessages = Substitute.For<IContactMessageRepository>();
    private readonly ContactService _service;

    public ContactServiceTests() =>
        _service = new ContactService(
            Substitute.For<IContactRepository>(),
            Substitute.For<IMessageRepository>(),
            _contactMessages);

    [Fact]
    public async Task InvalidForm_ReturnsErrors_AndSavesNothing()
    {
        var result = await _service.SubmitContactFormAsync(new ContactFormInfo("", "not-an-email", " "));

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        Assert.Equal(3, result.Errors.Count);
        await _contactMessages.DidNotReceiveWithAnyArgs().CreateContactWithMessageAsync(default!);
    }

    [Fact]
    public async Task ValidForm_IsTrimmedAndSaved_AndReturnsContactId()
    {
        _contactMessages.CreateContactWithMessageAsync(Arg.Any<ContactFormInfo>()).Returns(42);

        var result = await _service.SubmitContactFormAsync(new ContactFormInfo("  Anna Hansen ", " anna@innopixel.dk ", " Hej! "));

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Id);
        await _contactMessages.Received(1).CreateContactWithMessageAsync(
            Arg.Is<ContactFormInfo>(f => f.Fullname == "Anna Hansen" && f.Email == "anna@innopixel.dk" && f.Message == "Hej!"));
    }

    [Fact]
    public async Task DatabaseFailure_IsNotReportedAsSuccess()
    {
        _contactMessages.CreateContactWithMessageAsync(Arg.Any<ContactFormInfo>()).Returns((int?)null);

        var result = await _service.SubmitContactFormAsync(new ContactFormInfo("Anna", "anna@innopixel.dk", "Hej"));

        Assert.Equal(OperationResult.Failed, result.Result);
        Assert.Null(result.Id);
    }

    [Fact]
    public void Validate_RejectsTooLongMessage()
    {
        var errors = ContactService.Validate(new ContactFormInfo("Anna", "anna@innopixel.dk", new string('x', ContactFormLimits.MaxMessageLength + 1)));

        Assert.Single(errors);
    }
}
