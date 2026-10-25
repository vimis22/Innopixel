namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Domain;

public interface IContactRepository
{
    Task<OperationResult> CreateContactAsync(Contact contactInfo);

    Task<IReadOnlyList<Contact>> GetContactByIdAsync(int contactId);
    Task<IReadOnlyList<Contact>> GetContactByAllInfoAsync(string fullname, string? address, string email, string? registration);
    Task<IReadOnlyList<Contact>> GetContactByFullnameAsync(string fullname);
    Task<IReadOnlyList<Contact>> GetContactByAddressAsync(string address);
    Task<IReadOnlyList<Contact>> GetContactByEmailAsync(string email);
    Task<IReadOnlyList<Contact>> GetContactByRegistrationAsync(string registration);

    Task<OperationResult> UpdateContactByFullAsync(Contact contact, string fullname, string? address, string email, string? registration);
    Task<OperationResult> UpdateContactByFullnameAsync(Contact contact, string fullname);
    Task<OperationResult> UpdateContactByAddressAsync(Contact contact, string? address);
    Task<OperationResult> UpdateContactByEmailAsync(Contact contact, string email);
    Task<OperationResult> UpdateContactByRegistrationAsync(Contact contact, string? registration);

    Task<OperationResult> DeleteContactByAllInfoAsync(Contact contact);
}
