namespace Innopixel.Workspace.Domain;

// Rækker fra databasen, som platformen arbejder med. Datoer uden klokkeslæt er DATE-kolonner.

public class WsProject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Client { get; set; } = string.Empty;
    public int ManagerId { get; set; }
    public string Workstatus { get; set; } = WorkspaceValues.ProjectPlanned;
    public DateTime StartDate { get; set; }

    // Projektets slutdato (kolonnen deadline).
    public DateTime Deadline { get; set; }

    public string? ImageUrl { get; set; }
    public bool Archived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WsMember
{
    public int ProjectsId { get; set; }
    public int EmployeeId { get; set; }
    public DateTime AddedAt { get; set; }
}

public class WsTask
{
    public int Id { get; set; }
    public int ProjectsId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = WorkspaceValues.TaskTodo;
    public string Priority { get; set; } = "MEDIUM";
    public int? AssigneeId { get; set; }
    public string Taskgroup { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public int Progress { get; set; }
    public decimal? EstimateHours { get; set; }
    public int? MilestoneId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class WsChecklistItem
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; }
    public int Sortorder { get; set; }
}

public class WsDependency
{
    public int Id { get; set; }
    public int PredecessorId { get; set; }
    public int SuccessorId { get; set; }
}

public class WsMilestone
{
    public int Id { get; set; }
    public int ProjectsId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool Completedmanually { get; set; }
    public DateTime? Completedat { get; set; }
    public DateTime CreatedAt { get; set; }
}

// En række i progress-tabellen: name = ny status, comment = forrige status, changedby = brugerens id.
public class WsStatusHistory
{
    public int Id { get; set; }
    public int ProjectsId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public DateTime Changedat { get; set; }
    public string Changedby { get; set; } = string.Empty;
}

public class WsActivity
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public int ActorId { get; set; }
    public int? ProjectsId { get; set; }
    public int? TaskId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
