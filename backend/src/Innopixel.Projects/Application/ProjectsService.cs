namespace Innopixel.Projects.Application;

using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Contracts.Dtos;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;

public class ProjectsService(
    IProjectsRepository projectsRepository,
    ITechnologyRepository technologyRepository,
    ICategoryRepository categoryRepository,
    IServicesRepository servicesRepository,
    ITechnologyListRepository technologyListRepository,
    ICategoryListRepository categoryListRepository,
    IProjectListRepository projectListRepository) : IProjectsService
{
    public const int MaxNameLength = 200;
    public const int MaxDescriptionLength = 10000;

    public Task<IReadOnlyList<Projects>> GetPublishedProjectsAsync(int? categoryId = null, int? technologyId = null) =>
        projectsRepository.GetProjectsByFilterAsync(ProjectStatus.Published, categoryId, technologyId);

    public async Task<ProjectDetails?> GetPublishedProjectDetailsAsync(int projectId)
    {
        var project = await FindProjectAsync(projectId);
        return project?.CurrentStatus == ProjectStatus.Published ? await BuildDetailsAsync(project) : null;
    }

    public async Task<bool> IsPublishedAsync(int projectId) =>
        (await FindProjectAsync(projectId))?.CurrentStatus == ProjectStatus.Published;

    public Task<IReadOnlyList<Projects>> GetAllProjectsAsync() =>
        projectsRepository.GetAllProjectsAsync();

    public async Task<ProjectDetails?> GetProjectDetailsAsync(int projectId)
    {
        var project = await FindProjectAsync(projectId);
        return project is null ? null : await BuildDetailsAsync(project);
    }

    public async Task<ValidatedResult> CreateProjectAsync(Projects project)
    {
        var normalized = Normalize(project, defaultStatus: ProjectStatus.Draft);
        var errors = Validate(normalized);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        var id = await projectsRepository.CreateProjectsAndGetIdAsync(normalized);
        return id is null ? ValidatedResult.From(OperationResult.Failed) : ValidatedResult.Success(id);
    }

    public async Task<ValidatedResult> UpdateProjectAsync(Projects project)
    {
        // Er status ikke angivet, beholder projektet sin nuværende status.
        var existing = await FindProjectAsync(project.Id);
        if (existing is null)
        {
            return ValidatedResult.From(OperationResult.NotFound);
        }

        var normalized = Normalize(project, defaultStatus: existing.CurrentStatus);
        var errors = Validate(normalized);
        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        return ValidatedResult.From(await projectsRepository.UpdateProjectsByFullAsync(
            normalized, normalized.Name, normalized.Description, normalized.Deadline, normalized.CurrentStatus));
    }

    public Task<OperationResult> PublishProjectAsync(int projectId) =>
        projectsRepository.UpdateProjectsByCurrentStatusAsync(new Projects { Id = projectId }, ProjectStatus.Published);

    public Task<OperationResult> UnpublishProjectAsync(int projectId) =>
        projectsRepository.UpdateProjectsByCurrentStatusAsync(new Projects { Id = projectId }, ProjectStatus.Draft);

    public Task<OperationResult> DeleteProjectAsync(int projectId) =>
        projectsRepository.DeleteProjectsByAllInfoAsync(new Projects { Id = projectId });

    public async Task<OperationResult> SetProjectTechnologiesAsync(int projectId, IReadOnlyList<int> technologyIds) =>
        await FindProjectAsync(projectId) is null
            ? OperationResult.NotFound
            : await technologyListRepository.UpdateTechnologyListByTechnologiesAsync(projectId, technologyIds);

    public async Task<ValidatedResult> SetProjectCategoriesAsync(int projectId, IReadOnlyList<int> categoryIds, int? primaryCategoryId)
    {
        if (primaryCategoryId is { } primaryId && !categoryIds.Contains(primaryId))
        {
            return ValidatedResult.Invalid(["The primary category must be one of the project's categories."]);
        }

        if (await FindProjectAsync(projectId) is null)
        {
            return ValidatedResult.From(OperationResult.NotFound);
        }

        var categories = categoryIds
            .Select(categoryId => new CategoryList
            {
                ProjectsId = projectId,
                CategoryId = categoryId,
                IsPrimary = categoryId == primaryCategoryId
            })
            .ToList();

        return ValidatedResult.From(await categoryListRepository.UpdateCategoryListByCategoriesAsync(projectId, categories));
    }

    public async Task<OperationResult> SetProjectServicesAsync(int projectId, IReadOnlyList<int> serviceIds) =>
        await FindProjectAsync(projectId) is null
            ? OperationResult.NotFound
            : await projectListRepository.UpdateProjectListByServicesAsync(projectId, serviceIds);

    internal static List<string> Validate(Projects project)
    {
        var errors = new List<string>();

        Validator.Required(errors, project.Name, "Name", MaxNameLength);
        Validator.Optional(errors, project.Description, "Description", MaxDescriptionLength);
        if (!ProjectStatus.IsValid(project.CurrentStatus))
        {
            errors.Add($"Status must be '{ProjectStatus.Draft}' or '{ProjectStatus.Published}'.");
        }

        return errors;
    }

    private static Projects Normalize(Projects project, string defaultStatus) => new()
    {
        Id = project.Id,
        Name = project.Name?.Trim() ?? string.Empty,
        Description = string.IsNullOrWhiteSpace(project.Description) ? null : project.Description.Trim(),
        Deadline = project.Deadline,
        CurrentStatus = string.IsNullOrWhiteSpace(project.CurrentStatus) ? defaultStatus : project.CurrentStatus,
        ProgressId = project.ProgressId
    };

    private async Task<Projects?> FindProjectAsync(int projectId) =>
        (await projectsRepository.GetProjectsByIdAsync(projectId)).FirstOrDefault();

    private async Task<ProjectDetails> BuildDetailsAsync(Projects project)
    {
        var technologies = await technologyRepository.GetTechnologiesByProjectsIdAsync(project.Id);
        var categories = await categoryRepository.GetCategoriesByProjectsIdAsync(project.Id);
        var primary = await categoryListRepository.GetCategoryListByIsPrimaryAsync(project.Id, true);
        var services = await servicesRepository.GetServicesByProjectsIdAsync(project.Id);

        return new ProjectDetails(project, technologies, categories, primary.FirstOrDefault()?.CategoryId, services);
    }
}
