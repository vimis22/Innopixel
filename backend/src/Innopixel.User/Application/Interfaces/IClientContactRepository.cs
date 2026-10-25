namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen CONTACT.CLIENT_ID (svarer til "ContactList").
public interface IClientContactRepository
{
    Task<OperationResult> AssignContactToClientAsync(int contactId, int clientId);

    Task<IReadOnlyList<Contact>> GetContactsByClientIdAsync(int clientId);
    Task<Client?> GetClientByContactIdAsync(int contactId);

    Task<OperationResult> UpdateContactClientAsync(int contactId, int newClientId);

    Task<OperationResult> RemoveContactFromClientAsync(int contactId);
}
