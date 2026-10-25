namespace Innopixel.Images.Infrastructure;

public class ImageStorageOptions
{
    // Mappen på disken, hvor billederne gemmes (f.eks. wwwroot/uploads/images).
    public string RootPath { get; set; } = Path.Combine("wwwroot", "uploads", "images");

    // URL-stien, som mappen serveres under.
    public string PublicBasePath { get; set; } = "/uploads/images";
}
