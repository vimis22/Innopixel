namespace Innopixel.User.Contracts;

using Innopixel.Shared.Results;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

// Kontaktformularen (US-10, US-11) og admin-oversigten over henvendelser (US-16).
public interface IContactService
{
    // Validerer og gemmer henvendelsen. Id i resultatet er kontaktens id.
    // Success returneres kun, når henvendelsen faktisk er gemt (US-11).
    Task<ValidatedResult> SubmitContactFormAsync(ContactFormInfo contactFormInfo);

    Task<IReadOnlyList<Message>> GetAllInquiriesAsync();
    Task<IReadOnlyList<Message>> GetInquiriesByContactIdAsync(int contactId);
    Task<Contact?> GetContactByIdAsync(int contactId);

    // "Disabled" bruges til at markere en henvendelse som behandlet/arkiveret.
    Task<OperationResult> SetInquiryDisabledAsync(int messageId, bool disabled);

    Task<OperationResult> DeleteContactAsync(int contactId);
}
