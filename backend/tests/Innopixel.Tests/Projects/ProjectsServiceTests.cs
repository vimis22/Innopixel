namespace Innopixel.Tests.Projects;

using Innopixel.Projects.Application;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using NSubstitute;

public class ProjectsServiceTests
{
    private readonly IProjectsRepository _projects = Substitute.For<IProjectsRepository>();
    private readonly ICategoryListRepository _categoryLists = Substitute.For<ICategoryListRepository>();
    private readonly ProjectsService _service;

    public ProjectsServiceTests() =>
        _service = new ProjectsService(
            _projects,
            Substitute.For<ITechnologyRepository>(),
            Substitute.For<ICategoryRepository>(),
            Substitute.For<IServicesRepository>(),
            Substitute.For<ITechnologyListRepository>(),
            _categoryLists,
            Substitute.For<IProjectListRepository>());

    [Fact]
    public async Task NewProject_IsSavedAsDraft()
    {
        _projects.CreateProjectsAndGetIdAsync(Arg.Any<Projects>()).Returns(7);

        var result = await _service.CreateProjectAsync(new Projects { Name = "  Webshop  ", CurrentStatus = "" });

        Assert.True(result.IsSuccess);
        Assert.Equal(7, result.Id);
        await _projects.Received(1).CreateProjectsAndGetIdAsync(
            Arg.Is<Projects>(p => p.Name == "Webshop" && p.CurrentStatus == ProjectStatus.Draft));
    }

    [Fact]
    public async Task UpdateWithoutStatus_KeepsTheCurrentStatus()
    {
        _projects.GetProjectsByIdAsync(1).Returns([new Projects { Id = 1, Name = "Webshop", CurrentStatus = ProjectStatus.Published }]);
        _projects.UpdateProjectsByFullAsync(default!, default!, default, default, default!).ReturnsForAnyArgs(OperationResult.Success);

        var result = await _service.UpdateProjectAsync(new Projects { Id = 1, Name = "Ny webshop", CurrentStatus = "" });

        Assert.True(result.IsSuccess);
        await _projects.Received(1).UpdateProjectsByFullAsync(
            Arg.Any<Projects>(), "Ny webshop", null, null, ProjectStatus.Published);
    }

    [Fact]
    public async Task InvalidStatus_IsRejected()
    {
        var result = await _service.CreateProjectAsync(new Projects { Name = "Webshop", CurrentStatus = "Live" });

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _projects.DidNotReceiveWithAnyArgs().CreateProjectsAndGetIdAsync(default!);
    }

    [Fact]
    public async Task DraftProject_IsHiddenFromPublicDetails()
    {
        _projects.GetProjectsByIdAsync(1).Returns([new Projects { Id = 1, Name = "Kladde", CurrentStatus = ProjectStatus.Draft }]);

        Assert.Null(await _service.GetPublishedProjectDetailsAsync(1));
        Assert.False(await _service.IsPublishedAsync(1));
        Assert.NotNull(await _service.GetProjectDetailsAsync(1));
    }

    [Fact]
    public async Task PrimaryCategory_MustBeOneOfTheCategories()
    {
        var result = await _service.SetProjectCategoriesAsync(1, [2, 3], primaryCategoryId: 9);

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _categoryLists.DidNotReceiveWithAnyArgs().UpdateCategoryListByCategoriesAsync(default, default!);
    }

    [Fact]
    public async Task SetCategories_MarksOnlyThePrimary()
    {
        _projects.GetProjectsByIdAsync(1).Returns([new Projects { Id = 1, Name = "P" }]);
        _categoryLists.UpdateCategoryListByCategoriesAsync(1, Arg.Any<IReadOnlyList<CategoryList>>()).Returns(OperationResult.Success);

        var result = await _service.SetProjectCategoriesAsync(1, [2, 3], primaryCategoryId: 3);

        Assert.True(result.IsSuccess);
        await _categoryLists.Received(1).UpdateCategoryListByCategoriesAsync(1, Arg.Is<IReadOnlyList<CategoryList>>(list =>
            list.Count == 2 && list.Single(c => c.IsPrimary).CategoryId == 3));
    }

    [Fact]
    public async Task SetTechnologies_OnUnknownProject_IsNotFound()
    {
        _projects.GetProjectsByIdAsync(99).Returns([]);

        Assert.Equal(OperationResult.NotFound, await _service.SetProjectTechnologiesAsync(99, [1]));
    }
}
