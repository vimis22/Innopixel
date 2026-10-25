namespace Innopixel.User.Application;

using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public class ContactService(
    IContactRepository contactRepository,
    IMessageRepository messageRepository,
    IContactMessageRepository contactMessageRepository) : IContactService
{
    public async Task<ValidatedResult> SubmitContactFormAsync(ContactFormInfo contactFormInfo)
    {
        var errors = Validate(contactFormInfo);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        var trimmed = contactFormInfo with
        {
            Fullname = contactFormInfo.Fullname.Trim(),
            Email = contactFormInfo.Email.Trim(),
            Message = contactFormInfo.Message.Trim()
        };

        var contactId = await contactMessageRepository.CreateContactWithMessageAsync(trimmed);
        return contactId is null
            ? ValidatedResult.From(OperationResult.Failed)
            : ValidatedResult.Success(contactId);
    }

    public Task<IReadOnlyList<Message>> GetAllInquiriesAsync() =>
        contactMessageRepository.GetAllContactMessagesAsync();

    public Task<IReadOnlyList<Message>> GetInquiriesByContactIdAsync(int contactId) =>
        contactMessageRepository.GetMessagesByContactIdAsync(contactId);

    public async Task<Contact?> GetContactByIdAsync(int contactId) =>
        (await contactRepository.GetContactByIdAsync(contactId)).FirstOrDefault();

    public Task<OperationResult> SetInquiryDisabledAsync(int messageId, bool disabled) =>
        messageRepository.UpdateMessageByDisabledAsync(new Message { Id = messageId }, disabled);

    public Task<OperationResult> DeleteContactAsync(int contactId) =>
        contactRepository.DeleteContactByAllInfoAsync(new Contact { Id = contactId });

    internal static List<string> Validate(ContactFormInfo info)
    {
        var errors = new List<string>();

        Validator.Required(errors, info.Fullname, "Name", ContactFormLimits.MaxFullnameLength);
        if (!Validator.IsValidEmail(info.Email?.Trim()))
        {
            errors.Add("Email must be a valid email address.");
        }

        Validator.Required(errors, info.Message, "Message", ContactFormLimits.MaxMessageLength);
        Validator.Optional(errors, info.Address, "Address", ContactFormLimits.MaxAddressLength);
        Validator.Optional(errors, info.Registration, "Registration", ContactFormLimits.MaxRegistrationLength);

        return errors;
    }
}
