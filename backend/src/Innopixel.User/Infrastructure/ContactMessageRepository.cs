namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public class ContactMessageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IContactMessageRepository
{
    // SENDTIME sættes af databasen, så tidspunktet altid er serverens og ikke klientens.
    private const string InsertMessage =
        "INSERT INTO message (disabled, description, sendtime, contact_id) VALUES (false, @Description, now(), @ContactId)";

    public Task<OperationResult> CreateContactMessageAsync(int contactId, Message messageInfo) =>
        ExecuteAsync(InsertMessage, new { messageInfo.Description, ContactId = contactId });

    public async Task<int?> CreateContactWithMessageAsync(ContactFormInfo contactFormInfo)
    {
        int? contactId = null;

        var result = await InTransactionAsync(async (connection, transaction) =>
        {
            contactId = await connection.ExecuteScalarAsync<int>(
                "INSERT INTO contact (fullname, email, address, registration) VALUES (@Fullname, @Email, @Address, @Registration) RETURNING id",
                contactFormInfo, transaction);

            await connection.ExecuteAsync(
                InsertMessage,
                new { Description = contactFormInfo.Message, ContactId = contactId },
                transaction);
        });

        return result == OperationResult.Success ? contactId : null;
    }

    public Task<IReadOnlyList<Message>> GetMessagesByContactIdAsync(int contactId) =>
        QueryAsync<Message>(
            "SELECT * FROM message WHERE contact_id = @ContactId ORDER BY sendtime DESC",
            new { ContactId = contactId });

    public Task<Message?> GetMessageByIdAsync(int messageId) =>
        QuerySingleAsync<Message>("SELECT * FROM message WHERE id = @MessageId", new { MessageId = messageId });

    public Task<IReadOnlyList<Message>> GetAllContactMessagesAsync() =>
        QueryAsync<Message>("SELECT * FROM message WHERE contact_id IS NOT NULL ORDER BY sendtime DESC");
}
