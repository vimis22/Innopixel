namespace Innopixel.Workspace.Contracts;

// Svarer felt for felt til frontend/src/types/domain.ts. Id'er sendes som tekst, datoer som "yyyy-MM-dd".

public record UserDto(
    string Id, string Name, string Email, string Role, string Title, string? Department, string? Phone,
    bool Active, DateTime CreatedAt, decimal ExpectedWeeklyHours);

public record ProjectDto(
    string Id, string Name, string Description, string Client, string ManagerId, string Status,
    string StartDate, string EndDate, string? ImageUrl, bool Archived, DateTime CreatedAt, DateTime UpdatedAt);

public record ProjectMemberDto(string ProjectId, string UserId, DateTime AddedAt);

public record ChecklistItemDto(string Id, string Text, bool Done);

public record TaskDto(
    string Id, string ProjectId, string Title, string Description, string Status, string Priority,
    string? AssigneeId, string Group, string StartDate, string DueDate, int Progress, decimal? EstimateHours,
    string? MilestoneId, IReadOnlyList<ChecklistItemDto> Checklist, DateTime CreatedAt, DateTime UpdatedAt);

public record TaskDependencyDto(string Id, string PredecessorId, string SuccessorId);

public record MilestoneDto(
    string Id, string ProjectId, string Title, string Description, string DueDate,
    bool CompletedManually, DateTime? CompletedAt, DateTime CreatedAt);

public record ProjectStatusHistoryDto(string Id, string ProjectId, string? From, string To, string ChangedBy, DateTime ChangedAt);

public record ActivityLogDto(
    string Id, string Type, string ActorId, string? ProjectId, string? TaskId, string Message, DateTime CreatedAt);

public record WorkspaceDataDto(
    IReadOnlyList<UserDto> Users,
    IReadOnlyList<ProjectDto> Projects,
    IReadOnlyList<ProjectMemberDto> Members,
    IReadOnlyList<TaskDto> Tasks,
    IReadOnlyList<TaskDependencyDto> Dependencies,
    IReadOnlyList<MilestoneDto> Milestones,
    IReadOnlyList<ProjectStatusHistoryDto> StatusHistory,
    IReadOnlyList<ActivityLogDto> Activity);

// --- Input fra formularerne ---

public record ProjectInputDto(
    string? Name, string? Description, string? Client, string? ManagerId, string? Status,
    string? StartDate, string? EndDate, string? ImageUrl, IReadOnlyList<string>? MemberIds);

public record TaskInputDto(
    string? ProjectId, string? Title, string? Description, string? Status, string? Priority, string? AssigneeId,
    string? Group, string? StartDate, string? DueDate, int Progress, decimal? EstimateHours, string? MilestoneId,
    IReadOnlyList<string>? PredecessorIds);

public record TaskProgressPatchDto(string? Status, int? Progress);

public record TaskSchedulePatchDto(string? StartDate, string? DueDate);

public record ChecklistItemInputDto(string? Id, string? Text, bool Done);

public record MilestoneInputDto(string? ProjectId, string? Title, string? Description, string? DueDate, IReadOnlyList<string>? TaskIds);

// SendInvitation (only when creating): e-mail a link to choose a password instead of showing a temporary one
public record UserInputDto(
    string? Name, string? Email, string? Role, string? Title, string? Department, string? Phone, decimal? ExpectedWeeklyHours = null,
    bool SendInvitation = false);

public record ProfileInputDto(string? Name, string? Title, string? Department, string? Phone);

// Svar, når en administrator opretter en medarbejder. Er der sendt en invitation, er der ingen adgangskode;
// ellers vises den midlertidige adgangskode denne ene gang (medarbejderen skal skifte den ved første login).
public record CreatedUserDto(UserDto User, string? TemporaryPassword, bool InvitationSent = false);

// Fanen Adgang: login-oplysninger, aldrig adgangskoden
public record UserAccountDto(string Email, string Role, bool Active, bool MustChangePassword, DateTime? LastLoginAt, bool EmailConfigured);

// AdminPassword: administratorens egen adgangskode (bekræftelse af den følsomme handling)
public record TemporaryPasswordInputDto(string? Password, string? AdminPassword);

public record EmailStatusDto(bool Configured);
