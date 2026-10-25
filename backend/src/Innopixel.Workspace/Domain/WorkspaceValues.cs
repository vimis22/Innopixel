namespace Innopixel.Workspace.Domain;

// Gyldige værdier og de danske visningsnavne, som aktivitetsbeskederne bruger
// (samme tekster som frontend/src/i18n/app/da.ts).
public static class WorkspaceValues
{
    public const string ProjectPlanned = "PLANNED";
    public const string TaskTodo = "TODO";
    public const string TaskDone = "DONE";
    public const string RoleAdmin = "ADMIN";
    public const string RoleEmployee = "EMPLOYEE";

    public static readonly IReadOnlyDictionary<string, string> ProjectStatuses = new Dictionary<string, string>
    {
        ["PLANNED"] = "Planlagt",
        ["ACTIVE"] = "I gang",
        ["ON_HOLD"] = "På pause",
        ["COMPLETED"] = "Afsluttet",
        ["CANCELLED"] = "Annulleret"
    };

    public static readonly IReadOnlyDictionary<string, string> TaskStatuses = new Dictionary<string, string>
    {
        ["TODO"] = "Ikke startet",
        ["IN_PROGRESS"] = "I gang",
        ["IN_REVIEW"] = "Til review",
        ["DONE"] = "Færdig"
    };

    public static readonly IReadOnlySet<string> TaskPriorities = new HashSet<string> { "LOW", "MEDIUM", "HIGH", "CRITICAL" };
}

// Typer i activitylog.type.
public static class ActivityType
{
    public const string ProjectCreated = "PROJECT_CREATED";
    public const string ProjectUpdated = "PROJECT_UPDATED";
    public const string ProjectStatus = "PROJECT_STATUS";
    public const string ProjectArchived = "PROJECT_ARCHIVED";
    public const string ProjectRestored = "PROJECT_RESTORED";
    public const string TaskCreated = "TASK_CREATED";
    public const string TaskUpdated = "TASK_UPDATED";
    public const string TaskStatus = "TASK_STATUS";
    public const string TaskDeleted = "TASK_DELETED";
    public const string MilestoneCreated = "MILESTONE_CREATED";
    public const string MilestoneUpdated = "MILESTONE_UPDATED";
    public const string MilestoneCompleted = "MILESTONE_COMPLETED";
    public const string MilestoneDeleted = "MILESTONE_DELETED";
    public const string MemberAdded = "MEMBER_ADDED";
    public const string MemberRemoved = "MEMBER_REMOVED";
    public const string UserCreated = "USER_CREATED";
    public const string UserUpdated = "USER_UPDATED";
}
