namespace Innopixel.Main.Controllers;

using Innopixel.Main.Infrastructure;
using Innopixel.Workspace.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Innopixel Studio. Ét endpoint pr. metode i frontendens WorkspaceRepository.
// Hvem der må hvad, afgøres af IWorkspaceService ud fra den indloggede medarbejder.
[ApiController]
[Authorize]
[Route("api/workspace")]
public class WorkspaceController(IWorkspaceService workspace) : ControllerBase
{
    public record ArchivedRequest(bool Archived);
    public record MemberRequest(string? UserId);
    public record ProjectIdsRequest(IReadOnlyList<string>? ProjectIds);
    public record CompletedRequest(bool Completed);
    public record ActiveRequest(bool Active);

    private int ActorId => CurrentUser.Id(User);

    [HttpGet]
    public Task<WorkspaceDataDto> Load() => workspace.LoadAsync(ActorId);

    // --- Projekter ---

    [HttpPost("projects")]
    public async Task<ActionResult<ProjectDto>> CreateProject(ProjectInputDto input) =>
        StatusCode(StatusCodes.Status201Created, await workspace.CreateProjectAsync(ActorId, input));

    [HttpPut("projects/{projectId}")]
    public async Task<IActionResult> UpdateProject(string projectId, ProjectInputDto input)
    {
        await workspace.UpdateProjectAsync(ActorId, projectId, input);
        return NoContent();
    }

    [HttpPut("projects/{projectId}/archived")]
    public async Task<IActionResult> SetProjectArchived(string projectId, ArchivedRequest request)
    {
        await workspace.SetProjectArchivedAsync(ActorId, projectId, request.Archived);
        return NoContent();
    }

    [HttpPost("projects/{projectId}/members")]
    public async Task<IActionResult> AddProjectMember(string projectId, MemberRequest request)
    {
        await workspace.AddProjectMemberAsync(ActorId, projectId, request.UserId ?? string.Empty);
        return NoContent();
    }

    [HttpDelete("projects/{projectId}/members/{userId}")]
    public async Task<IActionResult> RemoveProjectMember(string projectId, string userId)
    {
        await workspace.RemoveProjectMemberAsync(ActorId, projectId, userId);
        return NoContent();
    }

    // --- Opgaver ---

    [HttpPost("tasks")]
    public async Task<ActionResult<TaskDto>> CreateTask(TaskInputDto input) =>
        StatusCode(StatusCodes.Status201Created, await workspace.CreateTaskAsync(ActorId, input));

    [HttpPut("tasks/{taskId}")]
    public async Task<IActionResult> UpdateTask(string taskId, TaskInputDto input)
    {
        await workspace.UpdateTaskAsync(ActorId, taskId, input);
        return NoContent();
    }

    [HttpPatch("tasks/{taskId}/progress")]
    public async Task<IActionResult> UpdateTaskProgress(string taskId, TaskProgressPatchDto patch)
    {
        await workspace.UpdateTaskProgressAsync(ActorId, taskId, patch);
        return NoContent();
    }

    [HttpPatch("tasks/{taskId}/schedule")]
    public async Task<IActionResult> UpdateTaskSchedule(string taskId, TaskSchedulePatchDto patch)
    {
        await workspace.UpdateTaskScheduleAsync(ActorId, taskId, patch);
        return NoContent();
    }

    [HttpPut("tasks/{taskId}/checklist")]
    public async Task<IActionResult> UpdateTaskChecklist(string taskId, IReadOnlyList<ChecklistItemInputDto> checklist)
    {
        await workspace.UpdateTaskChecklistAsync(ActorId, taskId, checklist);
        return NoContent();
    }

    [HttpDelete("tasks/{taskId}")]
    public async Task<IActionResult> DeleteTask(string taskId)
    {
        await workspace.DeleteTaskAsync(ActorId, taskId);
        return NoContent();
    }

    // --- Milepæle ---

    [HttpPost("milestones")]
    public async Task<IActionResult> CreateMilestone(MilestoneInputDto input)
    {
        await workspace.CreateMilestoneAsync(ActorId, input);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPut("milestones/{milestoneId}")]
    public async Task<IActionResult> UpdateMilestone(string milestoneId, MilestoneInputDto input)
    {
        await workspace.UpdateMilestoneAsync(ActorId, milestoneId, input);
        return NoContent();
    }

    [HttpPut("milestones/{milestoneId}/completed")]
    public async Task<IActionResult> SetMilestoneCompleted(string milestoneId, CompletedRequest request)
    {
        await workspace.SetMilestoneCompletedAsync(ActorId, milestoneId, request.Completed);
        return NoContent();
    }

    [HttpDelete("milestones/{milestoneId}")]
    public async Task<IActionResult> DeleteMilestone(string milestoneId)
    {
        await workspace.DeleteMilestoneAsync(ActorId, milestoneId);
        return NoContent();
    }

    // --- Team ---

    [HttpPost("users")]
    public async Task<ActionResult<CreatedUserDto>> CreateUser(UserInputDto input) =>
        StatusCode(StatusCodes.Status201Created, await workspace.CreateUserAsync(ActorId, input));

    [HttpPut("users/{userId}")]
    public async Task<IActionResult> UpdateUser(string userId, UserInputDto input)
    {
        await workspace.UpdateUserAsync(ActorId, userId, input);
        return NoContent();
    }

    [HttpPut("users/{userId}/active")]
    public async Task<IActionResult> SetUserActive(string userId, ActiveRequest request)
    {
        await workspace.SetUserActiveAsync(ActorId, userId, request.Active);
        return NoContent();
    }

    [HttpPut("users/{userId}/projects")]
    public async Task<IActionResult> SetUserProjects(string userId, ProjectIdsRequest request)
    {
        await workspace.SetUserProjectsAsync(ActorId, userId, request.ProjectIds ?? []);
        return NoContent();
    }

    // --- Adgang (administratorer). Adgangskoder vises og returneres aldrig. ---

    [HttpGet("users/{userId}/account")]
    public Task<UserAccountDto> GetUserAccount(string userId) => workspace.GetUserAccountAsync(ActorId, userId);

    // Administratoren bekræfter med sin egen adgangskode; medarbejderen skal vælge en ny ved næste login
    [HttpPut("users/{userId}/temporary-password")]
    public async Task<IActionResult> SetTemporaryPassword(string userId, TemporaryPasswordInputDto input)
    {
        await workspace.SetTemporaryPasswordAsync(ActorId, userId, input);
        return NoContent();
    }

    [HttpPost("users/{userId}/password-reset-email")]
    public async Task<IActionResult> SendPasswordResetEmail(string userId)
    {
        await workspace.SendPasswordResetAsync(ActorId, userId);
        return Accepted();
    }

    [HttpGet("email-status")]
    public Task<EmailStatusDto> GetEmailStatus() => workspace.GetEmailStatusAsync(ActorId);

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateOwnProfile(ProfileInputDto profile)
    {
        await workspace.UpdateOwnProfileAsync(ActorId, profile);
        return NoContent();
    }
}
