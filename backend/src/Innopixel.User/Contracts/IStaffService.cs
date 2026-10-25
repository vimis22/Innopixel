namespace Innopixel.User.Contracts;

// Medarbejderkonti. Valideringsfejl kastes som ServiceErrorException med en nøgle fra frontendens tekster.
public interface IStaffService
{
    Task<IReadOnlyList<StaffMember>> GetAllAsync();
    Task<StaffMember?> GetByIdAsync(int employeeId);

    // Opretter kontoen med en tilfældig midlertidig adgangskode, som vises én gang til administratoren
    // (medarbejderen skal vælge sin egen ved første login).
    Task<(StaffMember Staff, string TemporaryPassword)> CreateAsync(StaffInput input);

    Task UpdateAsync(int employeeId, StaffInput input);
    Task SetActiveAsync(int employeeId, bool active);
    Task UpdateProfileAsync(int employeeId, ProfileInput input);

    // Kontrollerer den nuværende adgangskode. Alle andre sessioner afsluttes; den nye security stamp returneres,
    // så den aktuelle session kan fortsætte.
    Task<Guid> ChangePasswordAsync(int employeeId, string currentPassword, string newPassword);
}

public interface IStaffAuthenticationService
{
    Task<LoginResult> LoginAsync(string email, string password);

    // Sætter adgangskoden for den første administrator, hvis den ikke er sat endnu (ved opstart).
    Task<bool> EnsureInitialPasswordAsync(string email, string password);
}
