namespace Innopixel.Workspace.Application;

using System.Globalization;
using Innopixel.User.Contracts;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Domain;

// Adgangsregler. Samme regler som frontend/src/features/auth/permissions.ts,
// men her håndhæves de: frontenden bruger dem kun til at vise og skjule knapper.
internal static class Permissions
{
    public static bool IsAdmin(StaffMember user) => user.IsAdmin;

    public static bool IsMember(WorkspaceSnapshot db, int projectId, int userId) =>
        db.Members.Any(m => m.ProjectsId == projectId && m.EmployeeId == userId);

    public static bool CanViewProject(StaffMember user, WsProject project, WorkspaceSnapshot db) =>
        IsAdmin(user) || project.ManagerId == user.Id || IsMember(db, project.Id, user.Id);

    public static bool CanCreateProject(StaffMember user) => IsAdmin(user);

    // Oprette/arkivere projekter og skifte projektleder: kun administratorer.
    public static bool CanAdministerProject(StaffMember user) => IsAdmin(user);

    // Planlægge projektet (opgaver, tidsplan, milepæle, medlemmer): administratorer og projektlederen.
    public static bool CanManageProject(StaffMember user, WsProject project) =>
        IsAdmin(user) || project.ManagerId == user.Id;

    // Den ansvarlige må opdatere status og fremdrift på sin egen opgave.
    public static bool CanUpdateTaskProgress(StaffMember user, WsTask task, WsProject project) =>
        CanManageProject(user, project) || task.AssigneeId == user.Id;

    public static bool CanManageTeam(StaffMember user) => IsAdmin(user);
}

// Beregninger, der skal give samme resultat som frontend/src/features/workspace/progress.ts.
internal static class WorkspaceCalculations
{
    // Holder fremdriften i overensstemmelse med status.
    public static int NormalizeProgress(string status, int progress, string? previous = null)
    {
        if (status == WorkspaceValues.TaskDone)
        {
            return 100;
        }

        if (previous == WorkspaceValues.TaskDone && progress >= 100)
        {
            return 90;
        }

        return Math.Clamp(progress, 0, 100);
    }

    // En milepæl med opgaver er fuldført, når alle dens opgaver er DONE (automatisk);
    // uden opgaver styres den manuelt.
    public static (bool Automatic, bool Completed) MilestoneState(WsMilestone milestone, IEnumerable<WsTask> tasks)
    {
        var related = tasks.Where(t => t.MilestoneId == milestone.Id).ToList();
        var automatic = related.Count > 0;
        var completed = automatic ? related.All(t => t.Status == WorkspaceValues.TaskDone) : milestone.Completedmanually;
        return (automatic, completed);
    }

    // Ville afhængighederne danne en ring (A venter på B, som venter på A)?
    public static bool CreatesCycle(int taskId, IReadOnlyCollection<int> predecessorIds, IEnumerable<WsDependency> dependencies)
    {
        var predecessorsOf = dependencies
            .Where(d => d.SuccessorId != taskId)
            .GroupBy(d => d.SuccessorId)
            .ToDictionary(g => g.Key, g => g.Select(d => d.PredecessorId).ToList());

        var stack = new Stack<int>(predecessorIds);
        var seen = new HashSet<int>();
        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (current == taskId)
            {
                return true;
            }

            if (seen.Add(current) && predecessorsOf.TryGetValue(current, out var next))
            {
                foreach (var id in next)
                {
                    stack.Push(id);
                }
            }
        }

        return false;
    }
}

internal static class WorkspaceIds
{
    // Id'er kommer som tekst fra frontenden. Et ugyldigt id behandles som "findes ikke".
    public static bool TryParse(string? value, out int id) =>
        int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out id) && id > 0;

    public static string Format(int id) => id.ToString(CultureInfo.InvariantCulture);

    public static string? Format(int? id) => id is { } value ? Format(value) : null;

    // "yyyy-MM-dd" (kalenderdato uden tidszone).
    public static bool TryParseDate(string? value, out DateTime date) =>
        DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    public static string FormatDate(DateTime date) => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}
