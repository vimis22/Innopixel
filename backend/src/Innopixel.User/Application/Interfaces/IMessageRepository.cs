namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

public interface IMessageRepository
{
    Task<OperationResult> CreateMessageAsync(Message messageInfo);

    Task<IReadOnlyList<Message>> GetMessageByIdAsync(int messageId);
    Task<IReadOnlyList<Message>> GetMessageByAllInfoAsync(bool disabled, string description, DateTime sendTime);
    Task<IReadOnlyList<Message>> GetMessageByDisabledAsync(bool disabled);
    Task<IReadOnlyList<Message>> GetMessageByDescriptionAsync(string description);
    Task<IReadOnlyList<Message>> GetMessageBySendTimeAsync(DateTime sendTime);

    Task<OperationResult> UpdateMessageByFullAsync(Message message, bool disabled, string description, DateTime sendTime);
    Task<OperationResult> UpdateMessageByDisabledAsync(Message message, bool disabled);
    Task<OperationResult> UpdateMessageByDescriptionAsync(Message message, string description);
    Task<OperationResult> UpdateMessageBySendTimeAsync(Message message, DateTime sendTime);

    Task<OperationResult> DeleteMessageByAllInfoAsync(Message message);
}
