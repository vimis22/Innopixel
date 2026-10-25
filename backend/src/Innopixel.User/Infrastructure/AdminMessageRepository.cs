namespace Innopixel.User.Infrastructure;

using Innopixel.Shared.Data;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

// admin.id er det samme som "user".id. Soft delete (deleted_at) ligger på "user".
public class AdminMessageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IAdminMessageRepository
{
    public Task<OperationResult> AssignMessageToAdminAsync(int adminId, int messageId) =>
        SetMessageAsync(adminId, messageId);

    public Task<Message?> GetMessageByAdminIdAsync(int adminId) =>
        QuerySingleAsync<Message>(
            """
            SELECT m.*
            FROM message m
            JOIN admin a ON a.message_id = m.id
            JOIN "user" u ON u.id = a.id
            WHERE a.id = @AdminId AND u.deleted_at IS NULL
            """,
            new { AdminId = adminId });

    public Task<IReadOnlyList<Admin>> GetAdminsByMessageIdAsync(int messageId) =>
        QueryAsync<Admin>(
            """
            SELECT u.*, a.message_id
            FROM admin a
            JOIN "user" u ON u.id = a.id
            WHERE a.message_id = @MessageId AND u.deleted_at IS NULL
            """,
            new { MessageId = messageId });

    public Task<OperationResult> UpdateAdminMessageAsync(int adminId, int newMessageId) =>
        SetMessageAsync(adminId, newMessageId);

    public Task<OperationResult> RemoveMessageFromAdminAsync(int adminId) =>
        SetMessageAsync(adminId, null);

    private Task<OperationResult> SetMessageAsync(int adminId, int? messageId) =>
        ExecuteAsync(
            """
            UPDATE admin a
            SET message_id = @MessageId
            FROM "user" u
            WHERE u.id = a.id AND a.id = @AdminId AND u.deleted_at IS NULL
            """,
            new { AdminId = adminId, MessageId = messageId });
}
