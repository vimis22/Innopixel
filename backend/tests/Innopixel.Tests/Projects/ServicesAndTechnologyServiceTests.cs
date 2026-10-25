namespace Innopixel.Tests.Projects;

using Innopixel.Projects.Application;
using Innopixel.Projects.Application.Interfaces;
using Innopixel.Projects.Domain;
using Innopixel.Shared.Results;
using NSubstitute;

public class ServicesAndTechnologyServiceTests
{
    [Theory]
    [InlineData("da", "Tekst", true)]
    [InlineData("en", "Text", true)]
    [InlineData("de", "Text", false)]
    [InlineData("da", "", false)]
    public void ServiceText_Validation(string languageType, string text, bool valid) =>
        Assert.Equal(valid, ServicesService.ValidateText(new Languages { LanguageType = languageType, Text = text }).Count == 0);

    [Fact]
    public async Task AddText_ToUnknownService_IsNotFound()
    {
        var services = Substitute.For<IServicesRepository>();
        services.GetServicesByIdAsync(5).Returns([]);
        var languages = Substitute.For<ILanguagesRepository>();

        var result = await new ServicesService(services, languages)
            .AddServiceTextAsync(5, new Languages { LanguageType = "da", Text = "Hej" });

        Assert.Equal(OperationResult.NotFound, result.Result);
        await languages.DidNotReceiveWithAnyArgs().CreateLanguagesForServicesAsync(default, default!);
    }

    [Fact]
    public async Task DuplicateTechnologyName_IsRejected_ButRenamingToSameNameIsAllowed()
    {
        var repository = Substitute.For<ITechnologyRepository>();
        repository.GetTechnologyByAllInfoAsync("React").Returns([new Technology { Id = 1, Name = "React" }]);
        repository.UpdateTechnologyByFullAsync(Arg.Any<Technology>(), "React").Returns(OperationResult.Success);
        var service = new TechnologyService(repository);

        Assert.Equal(OperationResult.InvalidInput, (await service.CreateTechnologyAsync(" React ")).Result);
        Assert.True((await service.RenameTechnologyAsync(1, "React")).IsSuccess);
        Assert.Equal(OperationResult.InvalidInput, (await service.RenameTechnologyAsync(2, "React")).Result);
    }
}
