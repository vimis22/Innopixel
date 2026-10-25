namespace Innopixel.Images.Infrastructure;

using Innopixel.Images.Application.Interfaces;

// Gemmer billeder i en mappe på serveren.
public class LocalImageStorage(ImageStorageOptions options) : IImageStorage
{
    // Uden afsluttende "/", så sammenligningen i ResolvePath også virker, hvis RootPath er sat med "/" til sidst.
    private readonly string _rootPath = Path.TrimEndingDirectorySeparator(Path.GetFullPath(options.RootPath));

    public async Task<string> SaveAsync(Stream content, string extension, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_rootPath);

        // Filnavnet genereres her, så brugerens filnavn aldrig bruges som sti på disken.
        var fileName = $"{Guid.NewGuid():N}{extension}";

        await using var file = new FileStream(ResolvePath(fileName), FileMode.CreateNew, FileAccess.Write);
        await content.CopyToAsync(file, cancellationToken);

        return fileName;
    }

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var path = ResolvePath(fileName);
        if (File.Exists(path))
        {
            File.Delete(path);
        }

        return Task.CompletedTask;
    }

    public string GetPublicUrl(string fileName) =>
        $"{options.PublicBasePath.TrimEnd('/')}/{Uri.EscapeDataString(fileName)}";

    // Afviser filnavne, der ville pege uden for billedmappen (f.eks. "../appsettings.json").
    private string ResolvePath(string fileName)
    {
        var path = Path.GetFullPath(Path.Combine(_rootPath, fileName));
        if (Path.GetDirectoryName(path) != _rootPath)
        {
            throw new ArgumentException("Invalid image file name.", nameof(fileName));
        }

        return path;
    }
}
