namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

// Relationen ADMIN.MESSAGE_ID (svarer til "MessageList").
public interface IAdminMessageRepository
{
    Task<OperationResult> AssignMessageToAdminAsync(int adminId, int messageId);

    Task<Message?> GetMessageByAdminIdAsync(int adminId);
    Task<IReadOnlyList<Admin>> GetAdminsByMessageIdAsync(int messageId);

    Task<OperationResult> UpdateAdminMessageAsync(int adminId, int newMessageId);

    Task<OperationResult> RemoveMessageFromAdminAsync(int adminId);
}
