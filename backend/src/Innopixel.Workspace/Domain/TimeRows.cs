namespace Innopixel.Workspace.Domain;

// En tidsregistrering = en række i worklog + koblingen i workloglist (UserId) + projektets navn.
// Checkout er null, mens medarbejderen er stemplet ind.
public class WsWorkLog
{
    public int Id { get; set; }
    public string? Description { get; set; }

    // Den danske kalenderdato for indstemplingen (kolonnen "date").
    public DateTime Date { get; set; }

    public DateTime Checkin { get; set; }
    public DateTime? Checkout { get; set; }
    public int? ProjectsId { get; set; }
    public string? ProjectName { get; set; }
    public int BreakMinutes { get; set; }
    public string Status { get; set; } = TimeStatus.Pending;
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public int UserId { get; set; }

    public bool IsActive => Checkout is null;
}

// En pause under en aktiv registrering. EndAt er null, mens pausen løber.
public class WsWorkLogBreak
{
    public int Id { get; set; }
    public int WorklogId { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
}

// Værdier i worklog.status. "ACTIVE" gemmes ikke; det betyder blot, at checkout mangler.
public static class TimeStatus
{
    public const string Active = "ACTIVE";
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
}

// Status for en medarbejders uge på teamoversigten.
public static class TeamTimeStatus
{
    public const string OnTrack = "ON_TRACK";
    public const string Behind = "BEHIND";
    public const string Missing = "MISSING";
}
