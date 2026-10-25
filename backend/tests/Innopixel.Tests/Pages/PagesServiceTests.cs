namespace Innopixel.Tests.Pages;

using Innopixel.Pages.Application;
using Innopixel.Pages.Application.Interfaces;
using Innopixel.Pages.Domain;
using Innopixel.Shared.Results;
using NSubstitute;

public class PagesServiceTests
{
    private readonly IPageRepository _pages = Substitute.For<IPageRepository>();
    private readonly PagesService _service;

    public PagesServiceTests() => _service = new PagesService(_pages);

    [Theory]
    [InlineData("about", true)]
    [InlineData("services/web-design", true)]
    [InlineData("About", false)]
    [InlineData("../admin", false)]
    [InlineData("om os", false)]
    [InlineData("a//b", false)]
    public void Slug_Validation(string slug, bool valid) =>
        Assert.Equal(valid, PagesService.Validate(new Page { Slug = slug, LanguageType = "da", Title = "T" }).Count == 0);

    [Fact]
    public void SeoLimits_AreEnforced()
    {
        var page = new Page
        {
            Slug = "about",
            LanguageType = "da",
            Title = "Om os",
            SeoTitle = new string('x', PagesService.MaxSeoTitleLength + 1),
            MetaDescription = new string('x', PagesService.MaxMetaDescriptionLength + 1)
        };

        Assert.Equal(2, PagesService.Validate(page).Count);
    }

    [Theory]
    [InlineData(true, true, "index, follow")]
    [InlineData(false, true, "noindex, nofollow")]
    [InlineData(true, false, "noindex, nofollow")]
    public void UnpublishedPages_AreNeverIndexed(bool published, bool indexable, string expected) =>
        Assert.Equal(expected, new Page { IsPublished = published, IsIndexable = indexable }.RobotsDirective);

    [Fact]
    public async Task UnpublishedPage_IsHiddenFromVisitors()
    {
        _pages.GetPageBySlugAsync("about", "da").Returns(new Page { Id = 1, Slug = "about", IsPublished = false });

        Assert.Null(await _service.GetPublishedPageAsync("about", "da"));
    }

    [Fact]
    public async Task DuplicateSlug_IsRejected_AndSlugIsNormalized()
    {
        _pages.GetPageBySlugAsync("about", "da").Returns(new Page { Id = 1, Slug = "about" });

        var result = await _service.CreatePageAsync(new Page { Slug = "/About/", LanguageType = "DA", Title = "Om os" });

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        Assert.Contains(result.Errors, e => e.Contains("already exists"));
    }
}
