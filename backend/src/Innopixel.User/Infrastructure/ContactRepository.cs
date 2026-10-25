namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class ContactRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IContactRepository
{
    private const string SelectContacts = "SELECT * FROM contact WHERE ";

    public Task<OperationResult> CreateContactAsync(Contact contactInfo) =>
        ExecuteAsync(
            "INSERT INTO contact (fullname, email, address, registration, client_id) VALUES (@Fullname, @Email, @Address, @Registration, @ClientId)",
            contactInfo);

    public Task<IReadOnlyList<Contact>> GetContactByIdAsync(int contactId) =>
        QueryAsync<Contact>(SelectContacts + "id = @ContactId", new { ContactId = contactId });

    public Task<IReadOnlyList<Contact>> GetContactByAllInfoAsync(string fullname, string? address, string email, string? registration) =>
        QueryAsync<Contact>(
            SelectContacts + "fullname = @Fullname AND address IS NOT DISTINCT FROM @Address AND email = @Email AND registration IS NOT DISTINCT FROM @Registration",
            new { Fullname = fullname, Address = address, Email = email, Registration = registration });

    public Task<IReadOnlyList<Contact>> GetContactByFullnameAsync(string fullname) =>
        QueryAsync<Contact>(SelectContacts + "fullname = @Fullname", new { Fullname = fullname });

    public Task<IReadOnlyList<Contact>> GetContactByAddressAsync(string address) =>
        QueryAsync<Contact>(SelectContacts + "address = @Address", new { Address = address });

    public Task<IReadOnlyList<Contact>> GetContactByEmailAsync(string email) =>
        QueryAsync<Contact>(SelectContacts + "email = @Email", new { Email = email });

    public Task<IReadOnlyList<Contact>> GetContactByRegistrationAsync(string registration) =>
        QueryAsync<Contact>(SelectContacts + "registration = @Registration", new { Registration = registration });

    public Task<OperationResult> UpdateContactByFullAsync(Contact contact, string fullname, string? address, string email, string? registration) =>
        ExecuteAsync(
            "UPDATE contact SET fullname = @Fullname, address = @Address, email = @Email, registration = @Registration WHERE id = @Id",
            new { contact.Id, Fullname = fullname, Address = address, Email = email, Registration = registration });

    public Task<OperationResult> UpdateContactByFullnameAsync(Contact contact, string fullname) =>
        ExecuteAsync("UPDATE contact SET fullname = @Fullname WHERE id = @Id", new { contact.Id, Fullname = fullname });

    public Task<OperationResult> UpdateContactByAddressAsync(Contact contact, string? address) =>
        ExecuteAsync("UPDATE contact SET address = @Address WHERE id = @Id", new { contact.Id, Address = address });

    public Task<OperationResult> UpdateContactByEmailAsync(Contact contact, string email) =>
        ExecuteAsync("UPDATE contact SET email = @Email WHERE id = @Id", new { contact.Id, Email = email });

    public Task<OperationResult> UpdateContactByRegistrationAsync(Contact contact, string? registration) =>
        ExecuteAsync("UPDATE contact SET registration = @Registration WHERE id = @Id", new { contact.Id, Registration = registration });

    // Sletter kontakten og alle dens beskeder (retten til sletning, GDPR).
    // Admins, der peger på en af beskederne, får ADMIN.MESSAGE_ID nulstillet.
    // Chats, der er blevet til denne henvendelse (CHATSESSION/CHATMESSAGE i ChatbotSystem-modulet),
    // indeholder de samme persondata og slettes derfor også.
    public Task<OperationResult> DeleteContactByAllInfoAsync(Contact contact) =>
        ExecuteAsync(
            """
            WITH admin_links AS (
                     UPDATE admin SET message_id = NULL
                     WHERE message_id IN (SELECT id FROM message WHERE contact_id = @Id)),
                 messages AS (DELETE FROM message WHERE contact_id = @Id),
                 chat_messages AS (
                     DELETE FROM chatmessage
                     WHERE chatsession_id IN (SELECT id FROM chatsession WHERE contact_id = @Id)),
                 chats AS (DELETE FROM chatsession WHERE contact_id = @Id)
            DELETE FROM contact WHERE id = @Id
            """,
            new { contact.Id });
}
