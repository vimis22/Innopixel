namespace Innopixel.IntegrationTests;

using Innopixel.ChatbotInterpreter.Application.Interfaces;
using Innopixel.ChatbotInterpreter.Domain;
using Innopixel.Images.Contracts;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Contracts;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Domain;

[Collection(DatabaseCollection.Name)]
public class ProjectsModuleTests(DatabaseFixture db)
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];

    [DatabaseFact]
    public async Task Project_IsDraftUntilPublished_AndCanBeFiltered()
    {
        var projects = db.Get<IProjectsService>();
        var technologyName = $"React-{Guid.NewGuid():N}";
        await db.Get<ITechnologyService>().CreateTechnologyAsync(technologyName);
        var technology = Assert.Single(await db.Get<ITechnologyRepository>().GetTechnologyByAllInfoAsync(technologyName));

        var projectId = (await projects.CreateProjectAsync(new Projects { Name = "Webshop" })).Id!.Value;
        Assert.Equal(OperationResult.Success, await projects.SetProjectTechnologiesAsync(projectId, [technology.Id, technology.Id]));

        Assert.DoesNotContain(await projects.GetPublishedProjectsAsync(technologyId: technology.Id), p => p.Id == projectId);
        Assert.Null(await projects.GetPublishedProjectDetailsAsync(projectId));

        Assert.Equal(OperationResult.Success, await projects.PublishProjectAsync(projectId));
        Assert.Contains(await projects.GetPublishedProjectsAsync(technologyId: technology.Id), p => p.Id == projectId);
        Assert.DoesNotContain(await projects.GetPublishedProjectsAsync(categoryId: -1), p => p.Id == projectId);

        var details = await projects.GetPublishedProjectDetailsAsync(projectId);
        Assert.Equal(technologyName, Assert.Single(details!.Technologies).Name);
    }

    [DatabaseFact]
    public async Task Project_HasAtMostOnePrimaryCategory()
    {
        var projects = db.Get<IProjectsService>();
        var categories = db.Get<ICategoryService>();
        var categoryLists = db.Get<ICategoryListRepository>();
        var webName = $"Web-{Guid.NewGuid():N}";
        var appName = $"App-{Guid.NewGuid():N}";
        await categories.CreateCategoryAsync(webName);
        await categories.CreateCategoryAsync(appName);
        var all = await categories.GetAllCategoriesAsync();
        var web = all.Single(c => c.Name == webName);
        var app = all.Single(c => c.Name == appName);
        var projectId = (await projects.CreateProjectAsync(new Projects { Name = "App og web" })).Id!.Value;

        Assert.True((await projects.SetProjectCategoriesAsync(projectId, [web.Id, app.Id], primaryCategoryId: web.Id)).IsSuccess);
        Assert.Equal(web.Id, (await projects.GetProjectDetailsAsync(projectId))!.PrimaryCategoryId);

        // Ny primær kategori: den gamle mister markeringen, så der stadig kun er én.
        Assert.Equal(OperationResult.Success, await categoryLists.UpdateCategoryListByIsPrimaryAsync(projectId, app.Id, true));
        Assert.Equal(app.Id, Assert.Single(await categoryLists.GetCategoryListByIsPrimaryAsync(projectId, true)).CategoryId);
    }

    [DatabaseFact]
    public async Task DeletingAProject_RemovesLinksProgressImagesAndSuggestions()
    {
        var projects = db.Get<IProjectsService>();
        var images = db.Get<IImagesService>();
        var projectId = (await projects.CreateProjectAsync(new Projects { Name = "Skal slettes" })).Id!.Value;

        var serviceId = (await db.Get<IServicesService>().CreateServiceAsync(new Services { ProjectDescription = "Hosting" })).Id!.Value;
        await projects.SetProjectServicesAsync(projectId, [serviceId]);
        await db.Get<IProgressRepository>().CreateProgressAsync(new Progress { Name = "Startet", ProjectsId = projectId });
        await db.Get<IAiSuggestionRepository>().CreateAiSuggestionAsync(new AiSuggestion { Type = AiSuggestionType.SeoTitle, SuggestedText = "Titel", ProjectsId = projectId });
        var filesBefore = Directory.Exists(db.ImageRoot) ? Directory.GetFiles(db.ImageRoot) : [];
        Assert.True((await images.UploadProjectImageAsync(projectId, new MemoryStream(Png), "logo.png", "Logo")).IsSuccess);
        var file = Assert.Single(Directory.GetFiles(db.ImageRoot).Except(filesBefore));

        Assert.Equal(OperationResult.Success, await images.DeleteProjectImagesAsync(projectId));
        Assert.False(File.Exists(file));
        Assert.Equal(OperationResult.Success, await projects.DeleteProjectAsync(projectId));

        Assert.Null(await projects.GetProjectDetailsAsync(projectId));
        Assert.Equal(0, await db.ScalarAsync<int>("SELECT COUNT(*)::int FROM progress WHERE projects_id = @Id", new { Id = projectId }));
        Assert.Equal(0, await db.ScalarAsync<int>("SELECT COUNT(*)::int FROM aisuggestion WHERE projects_id = @Id", new { Id = projectId }));
    }

    [DatabaseFact]
    public async Task ImagesAreOrdered_AndCanBeReordered()
    {
        var images = db.Get<IImagesService>();
        var projectId = (await db.Get<IProjectsService>().CreateProjectAsync(new Projects { Name = "Galleri" })).Id!.Value;
        var first = (await images.UploadProjectImageAsync(projectId, new MemoryStream(Png), "1.png", null)).Id!.Value;
        var second = (await images.UploadProjectImageAsync(projectId, new MemoryStream(Png), "2.png", null)).Id!.Value;

        Assert.Equal([first, second], (await images.GetProjectImagesAsync(projectId)).Select(i => i.Id));

        Assert.Equal(OperationResult.Success, await images.ReorderProjectImagesAsync(projectId, [second, first]));
        Assert.Equal([second, first], (await images.GetProjectImagesAsync(projectId)).Select(i => i.Id));
        Assert.StartsWith("/uploads/images/", (await images.GetProjectImagesAsync(projectId))[0].Url);

        // Et billede til et ukendt projekt afvises af databasen, og filen fjernes igen.
        var before = Directory.GetFiles(db.ImageRoot).Length;
        Assert.Equal(OperationResult.Failed, (await images.UploadProjectImageAsync(-1, new MemoryStream(Png), "x.png", null)).Result);
        Assert.Equal(before, Directory.GetFiles(db.ImageRoot).Length);
    }

    [DatabaseFact]
    public async Task Service_HasTextsPerLanguage_AndDeletingItRemovesItsLinks()
    {
        var services = db.Get<IServicesService>();
        var serviceId = (await services.CreateServiceAsync(new Services { ProjectDescription = "Webudvikling", IconIdentifier = "code" })).Id!.Value;

        Assert.True((await services.AddServiceTextAsync(serviceId, new Languages { LanguageType = "da", Text = "Hjemmesider" })).IsSuccess);
        Assert.True((await services.AddServiceTextAsync(serviceId, new Languages { LanguageType = "en", Text = "Websites" })).IsSuccess);
        Assert.Equal("Websites", Assert.Single((await services.GetServiceAsync(serviceId, "en"))!.Texts).Text);
        Assert.Equal(2, (await services.GetServiceAsync(serviceId))!.Texts.Count);

        // Servicen er også koblet til en rettighed (SERVICELIST i User-modulet).
        await db.Get<IRightsRepository>().CreateRightsAsync(new Rights { Read = true });
        var right = (await db.Get<IRightsRepository>().GetRightsByReadAsync(true)).Last();
        await db.Get<IServiceListRepository>().UpdateServiceListByRightsAsync(serviceId, [right.Id]);

        Assert.Equal(OperationResult.Success, await services.DeleteServiceAsync(serviceId));
        Assert.Null(await services.GetServiceAsync(serviceId));
        Assert.Empty(await db.Get<IServiceListRepository>().GetServiceListByServiceIdAsync(serviceId));
    }

    [DatabaseFact]
    public async Task DeletingProgress_ClearsTheProjectsReference()
    {
        var projectsRepository = db.Get<IProjectsRepository>();
        var progressRepository = db.Get<IProgressRepository>();
        var projectId = (await db.Get<IProjectsService>().CreateProjectAsync(new Projects { Name = "Med progress" })).Id!.Value;
        var name = $"Fase-{Guid.NewGuid():N}";
        await progressRepository.CreateProgressAsync(new Progress { Name = name, ProjectsId = projectId, ChangedAt = DateTime.UtcNow, ChangedBy = "Anna" });
        var progress = Assert.Single(await progressRepository.GetProgressByNameAsync(name));
        await db.ScalarAsync<int>("UPDATE projects SET progress_id = @ProgressId WHERE id = @Id", new { ProgressId = progress.Id, Id = projectId });

        Assert.Equal(OperationResult.Success, await progressRepository.DeleteProgressByAllInfoAsync(progress));
        Assert.Null(Assert.Single(await projectsRepository.GetProjectsByIdAsync(projectId)).ProgressId);
    }

    [DatabaseFact]
    public async Task ClientList_LinksClientsToProjects()
    {
        var clientId = await TestData.CreateUserAsync(db);
        await db.Get<IUserRepository>().AssignClientRoleAsync(clientId);
        var projectId = (await db.Get<IProjectsService>().CreateProjectAsync(new Projects { Name = "Kundeprojekt" })).Id!.Value;
        var clientLists = db.Get<IClientListRepository>();

        Assert.Equal(OperationResult.Success, await clientLists.UpdateClientListByClientsAsync(projectId, [clientId]));
        Assert.Single(await clientLists.GetClientListByClientIdAsync(clientId));

        // Kun clients kan kobles på: en almindelig bruger afvises af fremmednøglen.
        var notAClient = await TestData.CreateUserAsync(db);
        Assert.Equal(OperationResult.Failed, await clientLists.CreateClientListAsync(new ClientList { ClientId = notAClient, ProjectsId = projectId }));
    }
}
