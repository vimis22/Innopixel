namespace Innopixel.Pages.Domain;

// En offentlig side på hjemmesiden (f.eks. forside, "om os", kontakt) på ét sprog, med SEO-information (US-03, US-19).
public class Page
{
    public int Id { get; set; }

    // URL-delen, f.eks. "about" eller "services/web". Unik pr. sprog.
    public string Slug { get; set; } = string.Empty;

    public string LanguageType { get; set; } = "da";
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }

    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }

    public bool IsPublished { get; set; }

    // Kan slås fra for sider, der ikke skal i søgemaskiner, selvom de er publiceret.
    public bool IsIndexable { get; set; } = true;

    public DateTime? UpdatedAt { get; set; }

    // Upublicerede sider må aldrig indekseres (US-19).
    public bool ShouldBeIndexed => IsPublished && IsIndexable;

    public string RobotsDirective => ShouldBeIndexed ? "index, follow" : "noindex, nofollow";
}
