namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

// Relationen MESSAGE.CONTACT_ID: beskeder sendt via kontaktformularen.
public interface IContactMessageRepository
{
    Task<OperationResult> CreateContactMessageAsync(int contactId, Message messageInfo);

    // Opretter kontakt og besked i én transaktion. Returnerer kontaktens id, eller null hvis det fejler.
    Task<int?> CreateContactWithMessageAsync(ContactFormInfo contactFormInfo);

    Task<IReadOnlyList<Message>> GetMessagesByContactIdAsync(int contactId);
    Task<Message?> GetMessageByIdAsync(int messageId);
    Task<IReadOnlyList<Message>> GetAllContactMessagesAsync();
}
