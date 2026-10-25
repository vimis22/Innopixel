namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class ClientContactRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IClientContactRepository
{
    public Task<OperationResult> AssignContactToClientAsync(int contactId, int clientId) =>
        SetClientAsync(contactId, clientId);

    public Task<IReadOnlyList<Contact>> GetContactsByClientIdAsync(int clientId) =>
        QueryAsync<Contact>("SELECT * FROM contact WHERE client_id = @ClientId", new { ClientId = clientId });

    public Task<Client?> GetClientByContactIdAsync(int contactId) =>
        QuerySingleAsync<Client>(
            """
            SELECT u.*
            FROM client c
            JOIN "user" u ON u.id = c.id
            JOIN contact ct ON ct.client_id = c.id
            WHERE ct.id = @ContactId AND u.deleted_at IS NULL
            """,
            new { ContactId = contactId });

    public Task<OperationResult> UpdateContactClientAsync(int contactId, int newClientId) =>
        SetClientAsync(contactId, newClientId);

    public Task<OperationResult> RemoveContactFromClientAsync(int contactId) =>
        SetClientAsync(contactId, null);

    private Task<OperationResult> SetClientAsync(int contactId, int? clientId) =>
        ExecuteAsync(
            "UPDATE contact SET client_id = @ClientId WHERE id = @ContactId",
            new { ContactId = contactId, ClientId = clientId });
}
