namespace Innopixel.User.Application.Interfaces;

using Innopixel.Shared.Results;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public interface IUserRepository
{
    Task<OperationResult> CreateUserAsync(UserInfo userInfo);

    // Som CreateUserAsync, men returnerer brugerens id (eller null), så brugeren kan få en rolle.
    Task<int?> CreateUserAndGetIdAsync(UserInfo userInfo);

    Task<IReadOnlyList<User>> GetUserByIdAsync(int userId);
    Task<IReadOnlyList<User>> GetUserByEmailAsync(string email);

    Task<OperationResult> UpdateUserByEmailAsync(User user, string email);

    Task<OperationResult> DeleteUserByAllInfoAsync(User user);

    // --- Roller: en admin og en client ER en bruger med samme id (tabellerne admin og client) ---

    // NotFound, hvis brugeren ikke findes, er slettet eller allerede har rollen.
    Task<OperationResult> AssignAdminRoleAsync(int userId);
    Task<OperationResult> AssignClientRoleAsync(int userId);

    // Fjerner rollen. For admins fjernes også deres rettigheder (RIGHTSLIST),
    // for clients deres koblinger til projekter (CLIENTLIST) og kontakter.
    Task<OperationResult> RemoveAdminRoleAsync(int userId);
    Task<OperationResult> RemoveClientRoleAsync(int userId);

    Task<Admin?> GetAdminByIdAsync(int adminId);
    Task<Client?> GetClientByIdAsync(int clientId);
}
