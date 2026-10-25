namespace Innopixel.Images.Application.Interfaces;

// Hvor billedfilerne fysisk gemmes. Kan senere skiftes til f.eks. cloud storage uden at ændre ImagesService.
public interface IImageStorage
{
    // Gemmer indholdet under et nyt, genereret filnavn og returnerer filnavnet.
    Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default);

    Task DeleteAsync(string fileName, CancellationToken cancellationToken = default);

    string GetPublicUrl(string fileName);
}
