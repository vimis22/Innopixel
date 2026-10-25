namespace Innopixel.Workspace.Application;

using Innopixel.Shared.Results;
using Innopixel.User.Contracts;
using Innopixel.Workspace.Application.Interfaces;
using Innopixel.Workspace.Contracts;
using Innopixel.Workspace.Domain;
using static Innopixel.Workspace.Application.WorkspaceIds;

// Serverversionen af frontend/src/features/workspace/mockRepository.ts: samme regler, samme aktivitetsbeskeder.
// Hver operation læser platformens data, tjekker adgang og input, og gemmer ændringerne i én transaktion.
public class WorkspaceService(
    IWorkspaceRepository repository,
    IStaffService staffService,
    IPasswordService passwordService,
    TimeProvider timeProvider) : IWorkspaceService
{
    public const int ActivityLimit = 200;
    public const int MaxChecklistItems = 100;
    public const int MaxChecklistTextLength = 500;

    // ---------------------------------------------------------------- Load

    public async Task<WorkspaceDataDto> LoadAsync(int actorId)
    {
        var actor = await ActorAsync(actorId);
        var staff = await staffService.GetAllAsync();
        var db = await repository.GetSnapshotAsync();
        var history = await repository.GetStatusHistoryAsync();
        var activity = await repository.GetRecentActivityAsync(ActivityLimit);

        // Medarbejdere får kun de projekter, de deltager i (administratorer får alt).
        var projects = actor.IsAdmin ? db.Projects : db.Projects.Where(p => Permissions.CanViewProject(actor, p, db)).ToList();
        var ids = projects.Select(p => p.Id).ToHashSet();
        var tasks = db.Tasks.Where(t => ids.Contains(t.ProjectsId)).ToList();
        var taskIds = tasks.Select(t => t.Id).ToHashSet();

        return new WorkspaceDataDto(
            staff.Select(ToDto).ToList(),
            projects.Select(ToDto).ToList(),
            db.Members.Where(m => ids.Contains(m.ProjectsId)).Select(ToDto).ToList(),
            tasks.Select(t => ToDto(t, db.Checklist)).ToList(),
            db.Dependencies.Where(d => taskIds.Contains(d.PredecessorId) && taskIds.Contains(d.SuccessorId)).Select(ToDto).ToList(),
            db.Milestones.Where(m => ids.Contains(m.ProjectsId)).Select(ToDto).ToList(),
            history.Where(h => ids.Contains(h.ProjectsId)).Select(ToDto).ToList(),
            activity.Where(a => actor.IsAdmin || (a.ProjectsId is { } p && ids.Contains(p))).Select(ToDto).ToList());
    }

    // ---------------------------------------------------------------- Projects

    public async Task<ProjectDto> CreateProjectAsync(int actorId, ProjectInputDto input)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanCreateProject(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var staff = await staffService.GetAllAsync();
        var values = ValidateProject(input, staff);
        var now = Now();

        var project = new WsProject
        {
            Name = values.Name,
            Description = values.Description,
            Client = values.Client,
            ManagerId = values.ManagerId,
            Workstatus = values.Status,
            StartDate = values.StartDate,
            Deadline = values.EndDate,
            ImageUrl = values.ImageUrl,
            CreatedAt = now,
            UpdatedAt = now
        };

        project.Id = await repository.WriteAsync(async w =>
        {
            var id = await w.InsertProjectAsync(project);
            foreach (var userId in values.MemberIds.Prepend(values.ManagerId).Distinct())
            {
                await w.AddMemberAsync(id, userId, now);
            }

            await w.AddStatusHistoryAsync(id, null, project.Workstatus, actorId, now);
            await w.LogAsync(ActivityType.ProjectCreated, actorId, id, null, $"oprettede projektet \"{project.Name}\"", now);
            return id;
        });

        return ToDto(project);
    }

    public async Task UpdateProjectAsync(int actorId, string projectId, ProjectInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var project = ProjectOf(db, projectId);
        if (!Permissions.CanManageProject(actor, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var staff = await staffService.GetAllAsync();
        var values = ValidateProject(input, staff);

        // Kun administratorer kan give projektet til en anden projektleder.
        if (values.ManagerId != project.ManagerId && !Permissions.CanAdministerProject(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var now = Now();
        var previousStatus = project.Workstatus;
        project.Name = values.Name;
        project.Description = values.Description;
        project.Client = values.Client;
        project.ManagerId = values.ManagerId;
        project.Workstatus = values.Status;
        project.StartDate = values.StartDate;
        project.Deadline = values.EndDate;
        project.ImageUrl = values.ImageUrl;
        project.UpdatedAt = now;

        // Medlemslisten i formularen er den gældende; projektlederen er altid medlem.
        var wanted = values.MemberIds.Prepend(values.ManagerId).ToHashSet();
        var removed = db.Members.Where(m => m.ProjectsId == project.Id && !wanted.Contains(m.EmployeeId)).Select(m => m.EmployeeId).ToList();

        await repository.WriteAsync(async w =>
        {
            if (values.Status != previousStatus)
            {
                await w.AddStatusHistoryAsync(project.Id, previousStatus, values.Status, actorId, now);
                await w.LogAsync(ActivityType.ProjectStatus, actorId, project.Id, null,
                    $"ændrede status på \"{project.Name}\" til {WorkspaceValues.ProjectStatuses[values.Status]}", now);
            }
            else
            {
                await w.LogAsync(ActivityType.ProjectUpdated, actorId, project.Id, null, $"opdaterede projektet \"{project.Name}\"", now);
            }

            await w.UpdateProjectAsync(project);
            foreach (var userId in removed)
            {
                await w.RemoveMemberAsync(project.Id, userId);
                await w.UnassignOpenTasksAsync(project.Id, userId);
            }

            foreach (var userId in wanted)
            {
                await w.AddMemberAsync(project.Id, userId, now);
            }
        });
    }

    public async Task SetProjectArchivedAsync(int actorId, string projectId, bool archived)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanAdministerProject(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var project = ProjectOf(await repository.GetSnapshotAsync(), projectId);
        var now = Now();
        await repository.WriteAsync(async w =>
        {
            await w.SetProjectArchivedAsync(project.Id, archived, now);
            await w.LogAsync(archived ? ActivityType.ProjectArchived : ActivityType.ProjectRestored, actorId, project.Id, null,
                $"{(archived ? "arkiverede" : "gendannede")} projektet \"{project.Name}\"", now);
        });
    }

    public async Task AddProjectMemberAsync(int actorId, string projectId, string userId)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var project = ProjectOf(db, projectId);
        if (!Permissions.CanManageProject(actor, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var user = (await StaffOf(userId)) is { Active: true } found ? found : throw ServiceErrorException.NotFound();
        var now = Now();
        await repository.WriteAsync(async w =>
        {
            await w.AddMemberAsync(project.Id, user.Id, now);
            await w.LogAsync(ActivityType.MemberAdded, actorId, project.Id, null, $"tilføjede {user.Name} til \"{project.Name}\"", now);
        });
    }

    public async Task RemoveProjectMemberAsync(int actorId, string projectId, string userId)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var project = ProjectOf(db, projectId);
        if (!Permissions.CanManageProject(actor, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        if (project.ManagerId == user.Id)
        {
            throw ServiceErrorException.Validation("projects.managerCannotBeRemoved");
        }

        var now = Now();
        await repository.WriteAsync(async w =>
        {
            await w.RemoveMemberAsync(project.Id, user.Id);
            await w.UnassignOpenTasksAsync(project.Id, user.Id);
            await w.LogAsync(ActivityType.MemberRemoved, actorId, project.Id, null, $"fjernede {user.Name} fra \"{project.Name}\"", now);
        });
    }

    public async Task SetUserProjectsAsync(int actorId, string userId, IReadOnlyList<string> projectIds)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanManageTeam(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        var db = await repository.GetSnapshotAsync();
        var wanted = projectIds.Select(id => TryParse(id, out var value) ? value : 0).ToHashSet();
        var now = Now();

        await repository.WriteAsync(async w =>
        {
            foreach (var project in db.Projects)
            {
                var member = Permissions.IsMember(db, project.Id, user.Id);
                if (wanted.Contains(project.Id) && !member)
                {
                    await w.AddMemberAsync(project.Id, user.Id, now);
                    await w.LogAsync(ActivityType.MemberAdded, actorId, project.Id, null, $"tilføjede {user.Name} til \"{project.Name}\"", now);
                }
                else if (!wanted.Contains(project.Id) && member && project.ManagerId != user.Id)
                {
                    await w.RemoveMemberAsync(project.Id, user.Id);
                    await w.UnassignOpenTasksAsync(project.Id, user.Id);
                    await w.LogAsync(ActivityType.MemberRemoved, actorId, project.Id, null, $"fjernede {user.Name} fra \"{project.Name}\"", now);
                }
            }
        });
    }

    // ---------------------------------------------------------------- Tasks

    public async Task<TaskDto> CreateTaskAsync(int actorId, TaskInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var project = ProjectOf(db, input.ProjectId);
        if (!Permissions.CanManageProject(actor, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var values = ValidateTask(db, project, input, taskId: null);
        var now = Now();
        var task = new WsTask
        {
            ProjectsId = project.Id,
            Title = values.Title,
            Description = values.Description,
            Status = values.Status,
            Priority = values.Priority,
            AssigneeId = values.AssigneeId,
            Taskgroup = values.Group,
            StartDate = values.StartDate,
            DueDate = values.DueDate,
            Progress = WorkspaceCalculations.NormalizeProgress(values.Status, values.Progress),
            EstimateHours = values.EstimateHours,
            MilestoneId = values.MilestoneId,
            CreatedAt = now,
            UpdatedAt = now
        };

        await repository.WriteAsync(async w =>
        {
            task.Id = await w.InsertTaskAsync(task);
            await w.SetPredecessorsAsync(task.Id, values.PredecessorIds);
            await w.LogAsync(ActivityType.TaskCreated, actorId, project.Id, task.Id, $"oprettede opgaven \"{task.Title}\"", now);

            db.Tasks.Add(task);
            await SyncMilestonesAsync(w, db, actorId, now, task.MilestoneId);
        });

        return ToDto(task, []);
    }

    public async Task UpdateTaskAsync(int actorId, string taskId, TaskInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var task = TaskOf(db, taskId);
        var project = db.Projects.Single(p => p.Id == task.ProjectsId);

        // At flytte en opgave til et andet projekt understøttes ikke.
        if (!Permissions.CanManageProject(actor, project) || !TryParse(input.ProjectId, out var inputProjectId) || inputProjectId != task.ProjectsId)
        {
            throw ServiceErrorException.Forbidden();
        }

        var values = ValidateTask(db, project, input, task.Id);
        var now = Now();
        var previousMilestone = task.MilestoneId;
        var statusChanged = values.Status != task.Status;

        task.Title = values.Title;
        task.Description = values.Description;
        task.Priority = values.Priority;
        task.AssigneeId = values.AssigneeId;
        task.Taskgroup = values.Group;
        task.StartDate = values.StartDate;
        task.DueDate = values.DueDate;
        task.Progress = WorkspaceCalculations.NormalizeProgress(values.Status, values.Progress, task.Status);
        task.Status = values.Status;
        task.EstimateHours = values.EstimateHours;
        task.MilestoneId = values.MilestoneId;
        task.UpdatedAt = now;

        await repository.WriteAsync(async w =>
        {
            await w.UpdateTaskAsync(task);
            await w.SetPredecessorsAsync(task.Id, values.PredecessorIds);
            await w.LogAsync(statusChanged ? ActivityType.TaskStatus : ActivityType.TaskUpdated, actorId, project.Id, task.Id,
                statusChanged
                    ? $"flyttede \"{task.Title}\" til {WorkspaceValues.TaskStatuses[task.Status]}"
                    : $"opdaterede opgaven \"{task.Title}\"",
                now);
            await SyncMilestonesAsync(w, db, actorId, now, previousMilestone, task.MilestoneId);
        });
    }

    public async Task UpdateTaskProgressAsync(int actorId, string taskId, TaskProgressPatchDto patch)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var task = TaskOf(db, taskId);
        var project = db.Projects.Single(p => p.Id == task.ProjectsId);
        if (!Permissions.CanUpdateTaskProgress(actor, task, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var status = patch.Status ?? task.Status;
        if (!WorkspaceValues.TaskStatuses.ContainsKey(status))
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        var progress = patch.Progress ?? task.Progress;
        if (progress is < 0 or > 100)
        {
            throw ServiceErrorException.Validation("tasks.validation.progressRange");
        }

        var now = Now();
        var statusChanged = status != task.Status;
        task.Progress = WorkspaceCalculations.NormalizeProgress(status, progress, task.Status);
        task.Status = status;
        task.UpdatedAt = now;

        await repository.WriteAsync(async w =>
        {
            await w.UpdateTaskAsync(task);
            await w.LogAsync(statusChanged ? ActivityType.TaskStatus : ActivityType.TaskUpdated, actorId, project.Id, task.Id,
                statusChanged
                    ? $"flyttede \"{task.Title}\" til {WorkspaceValues.TaskStatuses[status]}"
                    : $"opdaterede fremdrift på \"{task.Title}\" til {task.Progress} %",
                now);
            await SyncMilestonesAsync(w, db, actorId, now, task.MilestoneId);
        });
    }

    public async Task UpdateTaskScheduleAsync(int actorId, string taskId, TaskSchedulePatchDto patch)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var task = TaskOf(db, taskId);
        if (!Permissions.CanManageProject(actor, db.Projects.Single(p => p.Id == task.ProjectsId)))
        {
            throw ServiceErrorException.Forbidden();
        }

        if (!TryParseDate(patch.StartDate, out var start) || !TryParseDate(patch.DueDate, out var due))
        {
            throw ServiceErrorException.Validation("tasks.validation.datesRequired");
        }

        if (due < start)
        {
            throw ServiceErrorException.Validation("tasks.validation.dueBeforeStart");
        }

        var now = Now();
        task.StartDate = start;
        task.DueDate = due;
        task.UpdatedAt = now;

        await repository.WriteAsync(async w =>
        {
            await w.UpdateTaskAsync(task);
            await w.LogAsync(ActivityType.TaskUpdated, actorId, task.ProjectsId, task.Id, $"ændrede tidsplanen for \"{task.Title}\"", now);
        });
    }

    public async Task UpdateTaskChecklistAsync(int actorId, string taskId, IReadOnlyList<ChecklistItemInputDto> checklist)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var task = TaskOf(db, taskId);
        if (!Permissions.CanUpdateTaskProgress(actor, task, db.Projects.Single(p => p.Id == task.ProjectsId)))
        {
            throw ServiceErrorException.Forbidden();
        }

        var items = checklist
            .Select(item => new WsChecklistItem { Text = item.Text?.Trim() ?? string.Empty, Done = item.Done })
            .Where(item => item.Text.Length > 0)
            .ToList();

        if (items.Count > MaxChecklistItems || items.Any(item => item.Text.Length > MaxChecklistTextLength))
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        task.UpdatedAt = Now();
        await repository.WriteAsync(async w =>
        {
            await w.SetChecklistAsync(task.Id, items);
            await w.UpdateTaskAsync(task);
        });
    }

    public async Task DeleteTaskAsync(int actorId, string taskId)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var task = TaskOf(db, taskId);
        if (!Permissions.CanManageProject(actor, db.Projects.Single(p => p.Id == task.ProjectsId)))
        {
            throw ServiceErrorException.Forbidden();
        }

        var now = Now();
        await repository.WriteAsync(async w =>
        {
            await w.DeleteTaskAsync(task.Id);
            await w.LogAsync(ActivityType.TaskDeleted, actorId, task.ProjectsId, null, $"slettede opgaven \"{task.Title}\"", now);

            db.Tasks.Remove(task);
            await SyncMilestonesAsync(w, db, actorId, now, task.MilestoneId);
        });
    }

    // ---------------------------------------------------------------- Milestones

    public async Task CreateMilestoneAsync(int actorId, MilestoneInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var project = ProjectOf(db, input.ProjectId);
        if (!Permissions.CanManageProject(actor, project))
        {
            throw ServiceErrorException.Forbidden();
        }

        var (title, description, dueDate) = ValidateMilestone(input);
        var taskIds = ParseIds(input.TaskIds);
        var now = Now();
        var milestone = new WsMilestone { ProjectsId = project.Id, Title = title, Description = description, DueDate = dueDate, CreatedAt = now };

        await repository.WriteAsync(async w =>
        {
            milestone.Id = await w.InsertMilestoneAsync(milestone);
            db.Milestones.Add(milestone);
            foreach (var task in db.Tasks.Where(t => t.ProjectsId == project.Id && taskIds.Contains(t.Id)))
            {
                task.MilestoneId = milestone.Id;
                await w.SetTaskMilestoneAsync(task.Id, milestone.Id);
            }

            await w.LogAsync(ActivityType.MilestoneCreated, actorId, project.Id, null, $"oprettede milepælen \"{milestone.Title}\"", now);
            await SyncMilestonesAsync(w, db, actorId, now, milestone.Id);
        });
    }

    public async Task UpdateMilestoneAsync(int actorId, string milestoneId, MilestoneInputDto input)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var milestone = MilestoneOf(db, milestoneId);
        var project = db.Projects.Single(p => p.Id == milestone.ProjectsId);
        if (!Permissions.CanManageProject(actor, project) || !TryParse(input.ProjectId, out var inputProjectId) || inputProjectId != milestone.ProjectsId)
        {
            throw ServiceErrorException.Forbidden();
        }

        var (title, description, dueDate) = ValidateMilestone(input);
        var taskIds = ParseIds(input.TaskIds);
        var now = Now();
        milestone.Title = title;
        milestone.Description = description;
        milestone.DueDate = dueDate;

        await repository.WriteAsync(async w =>
        {
            await w.UpdateMilestoneAsync(milestone);
            foreach (var task in db.Tasks.Where(t => t.ProjectsId == milestone.ProjectsId))
            {
                if (taskIds.Contains(task.Id) && task.MilestoneId != milestone.Id)
                {
                    task.MilestoneId = milestone.Id;
                    await w.SetTaskMilestoneAsync(task.Id, milestone.Id);
                }
                else if (!taskIds.Contains(task.Id) && task.MilestoneId == milestone.Id)
                {
                    task.MilestoneId = null;
                    await w.SetTaskMilestoneAsync(task.Id, null);
                }
            }

            await w.LogAsync(ActivityType.MilestoneUpdated, actorId, milestone.ProjectsId, null, $"opdaterede milepælen \"{milestone.Title}\"", now);
            await SyncMilestonesAsync(w, db, actorId, now, milestone.Id);
        });
    }

    public async Task SetMilestoneCompletedAsync(int actorId, string milestoneId, bool completed)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var milestone = MilestoneOf(db, milestoneId);
        if (!Permissions.CanManageProject(actor, db.Projects.Single(p => p.Id == milestone.ProjectsId)))
        {
            throw ServiceErrorException.Forbidden();
        }

        // Milepæle med opgaver følger deres opgaver og kan ikke fuldføres manuelt.
        if (WorkspaceCalculations.MilestoneState(milestone, db.Tasks).Automatic)
        {
            throw ServiceErrorException.Forbidden();
        }

        var now = Now();
        milestone.Completedmanually = completed;
        milestone.Completedat = completed ? now : null;

        await repository.WriteAsync(async w =>
        {
            await w.UpdateMilestoneAsync(milestone);
            await w.LogAsync(completed ? ActivityType.MilestoneCompleted : ActivityType.MilestoneUpdated, actorId, milestone.ProjectsId, null,
                $"{(completed ? "fuldførte" : "genåbnede")} milepælen \"{milestone.Title}\"", now);
        });
    }

    public async Task DeleteMilestoneAsync(int actorId, string milestoneId)
    {
        var actor = await ActorAsync(actorId);
        var db = await repository.GetSnapshotAsync();
        var milestone = MilestoneOf(db, milestoneId);
        if (!Permissions.CanManageProject(actor, db.Projects.Single(p => p.Id == milestone.ProjectsId)))
        {
            throw ServiceErrorException.Forbidden();
        }

        var now = Now();
        await repository.WriteAsync(async w =>
        {
            await w.DeleteMilestoneAsync(milestone.Id);
            await w.LogAsync(ActivityType.MilestoneDeleted, actorId, milestone.ProjectsId, null, $"slettede milepælen \"{milestone.Title}\"", now);
        });
    }

    // ---------------------------------------------------------------- Team

    public async Task<CreatedUserDto> CreateUserAsync(int actorId, UserInputDto input)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanManageTeam(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var (user, temporaryPassword) = await staffService.CreateAsync(ToStaffInput(input));
        await repository.WriteAsync(w => w.LogAsync(ActivityType.UserCreated, actorId, null, null, $"oprettede brugeren {user.Name}", Now()));

        if (input.SendInvitation && passwordService.EmailConfigured)
        {
            try
            {
                await passwordService.SendInvitationAsync(actorId, user.Id);
                return new CreatedUserDto(ToDto(user), null, InvitationSent: true);
            }
            catch (ServiceErrorException)
            {
                // The account exists; the administrator gets the temporary password instead of the invitation
            }
        }

        return new CreatedUserDto(ToDto(user), temporaryPassword);
    }

    public async Task UpdateUserAsync(int actorId, string userId, UserInputDto input)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanManageTeam(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        var staffInput = ToStaffInput(input);
        if (user.IsAdmin && !staffInput.IsAdmin && await ActiveAdminsExceptAsync(user.Id) == 0)
        {
            throw ServiceErrorException.Validation("team.validation.lastAdmin");
        }

        await staffService.UpdateAsync(user.Id, staffInput);
        await repository.WriteAsync(w => w.LogAsync(ActivityType.UserUpdated, actorId, null, null, $"opdaterede brugeren {staffInput.Name.Trim()}", Now()));
    }

    public async Task SetUserActiveAsync(int actorId, string userId, bool active)
    {
        var actor = await ActorAsync(actorId);
        if (!Permissions.CanManageTeam(actor))
        {
            throw ServiceErrorException.Forbidden();
        }

        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        if (user.Id == actorId)
        {
            throw ServiceErrorException.Validation("team.cannotDeactivateSelf");
        }

        if (!active && user.IsAdmin && await ActiveAdminsExceptAsync(user.Id) == 0)
        {
            throw ServiceErrorException.Validation("team.validation.lastAdmin");
        }

        await staffService.SetActiveAsync(user.Id, active);
        await repository.WriteAsync(w => w.LogAsync(ActivityType.UserUpdated, actorId, null, null,
            $"{(active ? "aktiverede" : "deaktiverede")} brugeren {user.Name}", Now()));
    }

    public async Task<UserAccountDto> GetUserAccountAsync(int actorId, string userId)
    {
        await RequireTeamManagerAsync(actorId);
        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        var account = await passwordService.GetAccountAsync(user.Id);
        return new UserAccountDto(user.Email, user.IsAdmin ? WorkspaceValues.RoleAdmin : WorkspaceValues.RoleEmployee, user.Active,
            account.MustChangePassword, account.LastLoginAt, passwordService.EmailConfigured);
    }

    public async Task SetTemporaryPasswordAsync(int actorId, string userId, TemporaryPasswordInputDto input)
    {
        await RequireTeamManagerAsync(actorId);
        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        await passwordService.SetTemporaryPasswordAsync(actorId, input.AdminPassword ?? string.Empty, user.Id, input.Password ?? string.Empty);
        await repository.WriteAsync(w => w.LogAsync(ActivityType.UserUpdated, actorId, null, null, $"angav en midlertidig adgangskode for {user.Name}", Now()));
    }

    public async Task SendPasswordResetAsync(int actorId, string userId)
    {
        await RequireTeamManagerAsync(actorId);
        var user = await StaffOf(userId) ?? throw ServiceErrorException.NotFound();
        await passwordService.SendResetLinkAsync(actorId, user.Id);
        await repository.WriteAsync(w => w.LogAsync(ActivityType.UserUpdated, actorId, null, null, $"sendte en nulstillingsmail til {user.Name}", Now()));
    }

    public async Task<EmailStatusDto> GetEmailStatusAsync(int actorId)
    {
        await RequireTeamManagerAsync(actorId);
        return new EmailStatusDto(passwordService.EmailConfigured);
    }

    private async Task RequireTeamManagerAsync(int actorId)
    {
        if (!Permissions.CanManageTeam(await ActorAsync(actorId)))
        {
            throw ServiceErrorException.Forbidden();
        }
    }

    public async Task UpdateOwnProfileAsync(int actorId, ProfileInputDto profile)
    {
        var actor = await ActorAsync(actorId);
        await staffService.UpdateProfileAsync(actor.Id,
            new ProfileInput(profile.Name ?? string.Empty, profile.Title ?? string.Empty, profile.Department, profile.Phone));
    }

    // ---------------------------------------------------------------- Helpers

    private DateTime Now() => timeProvider.GetUtcNow().UtcDateTime;

    // Den indloggede skal være en aktiv medarbejder. Deaktiveres man, mister man straks adgangen.
    private async Task<StaffMember> ActorAsync(int actorId) =>
        await staffService.GetByIdAsync(actorId) is { Active: true } actor ? actor : throw ServiceErrorException.Forbidden();

    private async Task<StaffMember?> StaffOf(string? userId) =>
        TryParse(userId, out var id) ? await staffService.GetByIdAsync(id) : null;

    private async Task<int> ActiveAdminsExceptAsync(int userId) =>
        (await staffService.GetAllAsync()).Count(u => u.IsAdmin && u.Active && u.Id != userId);

    private static WsProject ProjectOf(WorkspaceSnapshot db, string? projectId) =>
        TryParse(projectId, out var id) && db.Projects.FirstOrDefault(p => p.Id == id) is { } project
            ? project
            : throw ServiceErrorException.NotFound();

    private static WsTask TaskOf(WorkspaceSnapshot db, string? taskId) =>
        TryParse(taskId, out var id) && db.Tasks.FirstOrDefault(t => t.Id == id) is { } task
            ? task
            : throw ServiceErrorException.NotFound();

    private static WsMilestone MilestoneOf(WorkspaceSnapshot db, string? milestoneId) =>
        TryParse(milestoneId, out var id) && db.Milestones.FirstOrDefault(m => m.Id == id) is { } milestone
            ? milestone
            : throw ServiceErrorException.NotFound();

    private static HashSet<int> ParseIds(IEnumerable<string>? ids) =>
        (ids ?? []).Select(id => TryParse(id, out var value) ? value : 0).Where(id => id > 0).ToHashSet();

    // Registrerer milepæle, der blev fuldført (eller genåbnet), fordi deres opgaver ændrede sig.
    private static async Task SyncMilestonesAsync(IWorkspaceWriter w, WorkspaceSnapshot db, int actorId, DateTime now, params int?[] milestoneIds)
    {
        foreach (var id in milestoneIds.OfType<int>().Distinct())
        {
            var milestone = db.Milestones.FirstOrDefault(m => m.Id == id);
            if (milestone is null)
            {
                continue;
            }

            var (automatic, completed) = WorkspaceCalculations.MilestoneState(milestone, db.Tasks);
            if (!automatic)
            {
                continue;
            }

            if (completed && milestone.Completedat is null)
            {
                milestone.Completedat = now;
                await w.UpdateMilestoneAsync(milestone);
                await w.LogAsync(ActivityType.MilestoneCompleted, actorId, milestone.ProjectsId, null, $"fuldførte milepælen \"{milestone.Title}\"", now);
            }
            else if (!completed && milestone.Completedat is not null)
            {
                milestone.Completedat = null;
                await w.UpdateMilestoneAsync(milestone);
            }
        }
    }

    // ---------------------------------------------------------------- Validation

    private sealed record ProjectValues(
        string Name, string Description, string Client, int ManagerId, string Status, DateTime StartDate, DateTime EndDate,
        string? ImageUrl, IReadOnlyList<int> MemberIds);

    private static ProjectValues ValidateProject(ProjectInputDto input, IReadOnlyList<StaffMember> staff)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        if (name.Length is 0 or > 200)
        {
            throw ServiceErrorException.Validation("projects.validation.nameRequired");
        }

        var client = input.Client?.Trim() ?? string.Empty;
        if (client.Length is 0 or > 200)
        {
            throw ServiceErrorException.Validation("projects.validation.clientRequired");
        }

        if (!TryParse(input.ManagerId, out var managerId) || !staff.Any(u => u.Id == managerId && u.Active))
        {
            throw ServiceErrorException.Validation("projects.validation.managerRequired");
        }

        if (!TryParseDate(input.StartDate, out var start) || !TryParseDate(input.EndDate, out var end))
        {
            throw ServiceErrorException.Validation("projects.validation.datesRequired");
        }

        if (end < start)
        {
            throw ServiceErrorException.Validation("projects.validation.endBeforeStart");
        }

        if (input.Status is null || !WorkspaceValues.ProjectStatuses.ContainsKey(input.Status))
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        var description = input.Description?.Trim() ?? string.Empty;
        if (description.Length > 10000)
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        // Kun relative stier (f.eks. /images/x.png) eller http(s)-adresser, så der aldrig vises et javascript:-link.
        var imageUrl = string.IsNullOrWhiteSpace(input.ImageUrl) ? null : input.ImageUrl.Trim();
        if (imageUrl is not null && (imageUrl.Length > 500 || !IsSafeImageUrl(imageUrl)))
        {
            throw ServiceErrorException.Validation("projects.validation.imageInvalid");
        }

        var memberIds = new List<int>();
        foreach (var memberId in input.MemberIds ?? [])
        {
            if (!TryParse(memberId, out var id) || !staff.Any(u => u.Id == id))
            {
                throw ServiceErrorException.NotFound();
            }

            memberIds.Add(id);
        }

        return new ProjectValues(name, description, client, managerId, input.Status, start, end, imageUrl, memberIds);
    }

    internal static bool IsSafeImageUrl(string url) =>
        (url.StartsWith('/') && !url.StartsWith("//"))
        || (Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp));

    private sealed record TaskValues(
        string Title, string Description, string Status, string Priority, int? AssigneeId, string Group,
        DateTime StartDate, DateTime DueDate, int Progress, decimal? EstimateHours, int? MilestoneId, IReadOnlyCollection<int> PredecessorIds);

    private static TaskValues ValidateTask(WorkspaceSnapshot db, WsProject project, TaskInputDto input, int? taskId)
    {
        var title = input.Title?.Trim() ?? string.Empty;
        if (title.Length is 0 or > 200)
        {
            throw ServiceErrorException.Validation("tasks.validation.titleRequired");
        }

        var group = input.Group?.Trim() ?? string.Empty;
        if (group.Length is 0 or > 100)
        {
            throw ServiceErrorException.Validation("tasks.validation.groupRequired");
        }

        if (!TryParseDate(input.StartDate, out var start) || !TryParseDate(input.DueDate, out var due))
        {
            throw ServiceErrorException.Validation("tasks.validation.datesRequired");
        }

        if (due < start)
        {
            throw ServiceErrorException.Validation("tasks.validation.dueBeforeStart");
        }

        if (input.Progress is < 0 or > 100)
        {
            throw ServiceErrorException.Validation("tasks.validation.progressRange");
        }

        if (input.EstimateHours is { } hours && (hours <= 0 || hours > 99999))
        {
            throw ServiceErrorException.Validation("tasks.validation.estimateRange");
        }

        if (input.Status is null || !WorkspaceValues.TaskStatuses.ContainsKey(input.Status)
            || input.Priority is null || !WorkspaceValues.TaskPriorities.Contains(input.Priority))
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        var description = input.Description?.Trim() ?? string.Empty;
        if (description.Length > 5000)
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        int? assigneeId = null;
        if (!string.IsNullOrEmpty(input.AssigneeId))
        {
            if (!TryParse(input.AssigneeId, out var id) || !Permissions.IsMember(db, project.Id, id))
            {
                throw ServiceErrorException.Validation("tasks.validation.assigneeNotMember");
            }

            assigneeId = id;
        }

        int? milestoneId = null;
        if (!string.IsNullOrEmpty(input.MilestoneId))
        {
            if (!TryParse(input.MilestoneId, out var id) || !db.Milestones.Any(m => m.Id == id && m.ProjectsId == project.Id))
            {
                throw ServiceErrorException.NotFound();
            }

            milestoneId = id;
        }

        var predecessorIds = new HashSet<int>();
        foreach (var predecessor in input.PredecessorIds ?? [])
        {
            if (!TryParse(predecessor, out var id) || id == taskId || !db.Tasks.Any(t => t.Id == id && t.ProjectsId == project.Id))
            {
                throw ServiceErrorException.NotFound();
            }

            predecessorIds.Add(id);
        }

        if (taskId is { } existing && WorkspaceCalculations.CreatesCycle(existing, predecessorIds, db.Dependencies))
        {
            throw ServiceErrorException.Validation("tasks.validation.dependencyCycle");
        }

        return new TaskValues(title, description, input.Status, input.Priority, assigneeId, group, start, due,
            input.Progress, input.EstimateHours, milestoneId, predecessorIds);
    }

    private static (string Title, string Description, DateTime DueDate) ValidateMilestone(MilestoneInputDto input)
    {
        var title = input.Title?.Trim() ?? string.Empty;
        if (title.Length is 0 or > 200)
        {
            throw ServiceErrorException.Validation("milestones.validation.titleRequired");
        }

        if (!TryParseDate(input.DueDate, out var due))
        {
            throw ServiceErrorException.Validation("milestones.validation.dateRequired");
        }

        var description = input.Description?.Trim() ?? string.Empty;
        return description.Length > 2000 ? throw ServiceErrorException.Validation("errors.invalidRequest") : (title, description, due);
    }

    private static StaffInput ToStaffInput(UserInputDto input)
    {
        if (input.Role is not (WorkspaceValues.RoleAdmin or WorkspaceValues.RoleEmployee))
        {
            throw ServiceErrorException.Validation("errors.invalidRequest");
        }

        return new StaffInput(input.Name ?? string.Empty, input.Email ?? string.Empty, input.Role == WorkspaceValues.RoleAdmin,
            input.Title ?? string.Empty, input.Department, input.Phone, input.ExpectedWeeklyHours);
    }

    // ---------------------------------------------------------------- Mapping to the API

    private static UserDto ToDto(StaffMember user) => UserDtoMapper.ToDto(user);

    private static ProjectDto ToDto(WsProject p) => new(
        Format(p.Id), p.Name, p.Description ?? string.Empty, p.Client, Format(p.ManagerId), p.Workstatus,
        FormatDate(p.StartDate), FormatDate(p.Deadline), p.ImageUrl, p.Archived, Utc(p.CreatedAt), Utc(p.UpdatedAt));

    private static ProjectMemberDto ToDto(WsMember m) => new(Format(m.ProjectsId), Format(m.EmployeeId), Utc(m.AddedAt));

    private static TaskDto ToDto(WsTask t, IEnumerable<WsChecklistItem> checklist) => new(
        Format(t.Id), Format(t.ProjectsId), t.Title, t.Description, t.Status, t.Priority, Format(t.AssigneeId), t.Taskgroup,
        FormatDate(t.StartDate), FormatDate(t.DueDate), t.Progress, t.EstimateHours, Format(t.MilestoneId),
        checklist.Where(c => c.TaskId == t.Id).Select(c => new ChecklistItemDto(Format(c.Id), c.Text, c.Done)).ToList(),
        Utc(t.CreatedAt), Utc(t.UpdatedAt));

    private static TaskDependencyDto ToDto(WsDependency d) => new(Format(d.Id), Format(d.PredecessorId), Format(d.SuccessorId));

    private static MilestoneDto ToDto(WsMilestone m) => new(
        Format(m.Id), Format(m.ProjectsId), m.Title, m.Description, FormatDate(m.DueDate), m.Completedmanually,
        m.Completedat is { } completed ? Utc(completed) : null, Utc(m.CreatedAt));

    private static ProjectStatusHistoryDto ToDto(WsStatusHistory h) => new(
        Format(h.Id), Format(h.ProjectsId), h.Comment, h.Name, h.Changedby, Utc(h.Changedat));

    private static ActivityLogDto ToDto(WsActivity a) => new(
        Format(a.Id), a.Type, Format(a.ActorId), Format(a.ProjectsId), Format(a.TaskId), a.Message, Utc(a.CreatedAt));

    private static DateTime Utc(DateTime value) => value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);
}
