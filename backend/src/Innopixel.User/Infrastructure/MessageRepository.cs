namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

public class MessageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IMessageRepository
{
    private const string SelectMessages = "SELECT * FROM message WHERE ";

    public Task<OperationResult> CreateMessageAsync(Message messageInfo) =>
        ExecuteAsync(
            "INSERT INTO message (disabled, description, sendtime, contact_id) VALUES (@Disabled, @Description, @SendTime, @ContactId)",
            messageInfo);

    public Task<IReadOnlyList<Message>> GetMessageByIdAsync(int messageId) =>
        QueryAsync<Message>(SelectMessages + "id = @MessageId", new { MessageId = messageId });

    public Task<IReadOnlyList<Message>> GetMessageByAllInfoAsync(bool disabled, string description, DateTime sendTime) =>
        QueryAsync<Message>(
            SelectMessages + "disabled = @Disabled AND description = @Description AND sendtime = @SendTime",
            new { Disabled = disabled, Description = description, SendTime = sendTime });

    public Task<IReadOnlyList<Message>> GetMessageByDisabledAsync(bool disabled) =>
        QueryAsync<Message>(SelectMessages + "disabled = @Disabled", new { Disabled = disabled });

    public Task<IReadOnlyList<Message>> GetMessageByDescriptionAsync(string description) =>
        QueryAsync<Message>(SelectMessages + "description = @Description", new { Description = description });

    public Task<IReadOnlyList<Message>> GetMessageBySendTimeAsync(DateTime sendTime) =>
        QueryAsync<Message>(SelectMessages + "sendtime = @SendTime", new { SendTime = sendTime });

    public Task<OperationResult> UpdateMessageByFullAsync(Message message, bool disabled, string description, DateTime sendTime) =>
        ExecuteAsync(
            "UPDATE message SET disabled = @Disabled, description = @Description, sendtime = @SendTime WHERE id = @Id",
            new { message.Id, Disabled = disabled, Description = description, SendTime = sendTime });

    public Task<OperationResult> UpdateMessageByDisabledAsync(Message message, bool disabled) =>
        ExecuteAsync("UPDATE message SET disabled = @Disabled WHERE id = @Id", new { message.Id, Disabled = disabled });

    public Task<OperationResult> UpdateMessageByDescriptionAsync(Message message, string description) =>
        ExecuteAsync("UPDATE message SET description = @Description WHERE id = @Id", new { message.Id, Description = description });

    public Task<OperationResult> UpdateMessageBySendTimeAsync(Message message, DateTime sendTime) =>
        ExecuteAsync("UPDATE message SET sendtime = @SendTime WHERE id = @Id", new { message.Id, SendTime = sendTime });

    // Admins, der peger på beskeden via ADMIN.MESSAGE_ID, får feltet nulstillet i samme SQL-sætning.
    public Task<OperationResult> DeleteMessageByAllInfoAsync(Message message) =>
        ExecuteAsync(
            """
            WITH admin_links AS (UPDATE admin SET message_id = NULL WHERE message_id = @Id)
            DELETE FROM message WHERE id = @Id
            """,
            new { message.Id });
}
