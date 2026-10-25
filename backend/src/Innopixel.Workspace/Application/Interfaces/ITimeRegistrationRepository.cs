namespace Innopixel.Workspace.Application.Interfaces;

using Innopixel.Workspace.Domain;

public interface ITimeRegistrationRepository
{
    Task<WsWorkLog?> GetByIdAsync(int worklogId);
    Task<WsWorkLog?> GetActiveAsync(int userId);
    Task<WsWorkLog?> GetLatestAsync(int userId);

    // Registreringer med dato fra og med from til og med to. userId null = alle medarbejdere.
    Task<IReadOnlyList<WsWorkLog>> GetByDateRangeAsync(int? userId, DateOnly from, DateOnly to);

    // Afsluttede registreringer, der afventer godkendelse. userId null = alle.
    Task<IReadOnlyList<WsWorkLog>> GetPendingAsync(int? userId);

    Task<IReadOnlyList<WsWorkLogBreak>> GetBreaksAsync(IReadOnlyCollection<int> worklogIds);

    // Navnet på projektet, hvis medarbejderen må registrere tid på det (platformsprojekt, ikke arkiveret,
    // og medarbejderen er administrator, projektleder eller medlem). Ellers null.
    Task<string?> GetSelectableProjectNameAsync(int projectId, int userId, bool isAdmin);

    // Kører ændringerne i én transaktion, efter at medarbejderens række er låst (SELECT ... FOR UPDATE),
    // så to samtidige kald for samme person ikke kan oprette overlappende registreringer.
    Task<T> WriteAsync<T>(int userId, Func<ITimeWriter, Task<T>> changes);
}

public interface ITimeWriter
{
    Task<WsWorkLog?> GetActiveAsync(int userId);
    Task<bool> HasOverlapAsync(int userId, DateTime start, DateTime end, int? exceptWorklogId);

    Task<int> InsertAsync(WsWorkLog log);
    Task UpdateAsync(WsWorkLog log);
    Task DeleteAsync(int worklogId);

    Task<IReadOnlyList<WsWorkLogBreak>> GetBreaksAsync(int worklogId);
    Task StartBreakAsync(int worklogId, DateTime at);

    // Afslutter en løbende pause (hvis der er en).
    Task EndOpenBreakAsync(int worklogId, DateTime at);
}
