namespace Innopixel.Images.Application;

using Innopixel.Images.Application.Interfaces;
using Innopixel.Images.Contracts;
using Innopixel.Images.Domain;
using Innopixel.Shared.Results;
using Innopixel.Shared.Validation;

public class ImagesService(IImageRepository imageRepository, IImageStorage imageStorage) : IImagesService
{
    public const long MaxSizeBytes = 5 * 1024 * 1024;
    public const int MaxAltTextLength = 300;
    public const int MaxOriginalFileNameLength = 255;

    public async Task<ValidatedResult> UploadProjectImageAsync(
        int projectId,
        Stream content,
        string? originalFileName,
        string? altText,
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        Validator.Optional(errors, altText, "Alt text", MaxAltTextLength);

        // Indholdet læses ind i hukommelsen (højst MaxSizeBytes + 1), så størrelsen og formatet kan tjekkes,
        // før noget gemmes. Content-Type og filendelse fra klienten stoles der ikke på.
        using var buffer = new MemoryStream();
        await CopyAtMostAsync(content, buffer, MaxSizeBytes + 1, cancellationToken);

        if (buffer.Length == 0)
        {
            errors.Add("The file is empty.");
        }
        else if (buffer.Length > MaxSizeBytes)
        {
            errors.Add($"The image must be at most {MaxSizeBytes / (1024 * 1024)} MB.");
        }

        var format = ImageFormat.Detect(buffer.GetBuffer().AsSpan(0, (int)Math.Min(buffer.Length, ImageFormat.HeaderLength)));
        if (buffer.Length > 0 && format is null)
        {
            errors.Add("Only JPEG, PNG and WebP images are allowed.");
        }

        if (errors.Count > 0)
        {
            return ValidatedResult.Invalid(errors);
        }

        buffer.Position = 0;
        var fileName = await imageStorage.SaveAsync(buffer, format!.Extension, cancellationToken);

        int? id;
        try
        {
            id = await imageRepository.CreateImageAsync(new Image
            {
                ProjectsId = projectId,
                FileName = fileName,
                OriginalFileName = TrimFileName(originalFileName),
                ContentType = format.ContentType,
                SizeBytes = buffer.Length,
                AltText = string.IsNullOrWhiteSpace(altText) ? null : altText.Trim(),
                SortOrder = await imageRepository.GetNextSortOrderAsync(projectId)
            });
        }
        catch
        {
            // Filen må ikke ligge tilbage uden en række i databasen.
            await imageStorage.DeleteAsync(fileName, CancellationToken.None);
            throw;
        }

        if (id is null)
        {
            // Rækken kunne ikke gemmes (f.eks. ukendt projekt), så filen må ikke ligge tilbage.
            await imageStorage.DeleteAsync(fileName, CancellationToken.None);
            return ValidatedResult.From(OperationResult.Failed);
        }

        return ValidatedResult.Success(id);
    }

    public async Task<IReadOnlyList<ImageInfo>> GetProjectImagesAsync(int projectId) =>
        (await imageRepository.GetImagesByProjectsIdAsync(projectId))
        .Select(image => new ImageInfo(image.Id, image.ProjectsId, imageStorage.GetPublicUrl(image.FileName), image.AltText, image.SortOrder))
        .ToList();

    public async Task<ValidatedResult> UpdateAltTextAsync(int imageId, string? altText)
    {
        var errors = new List<string>();
        Validator.Optional(errors, altText, "Alt text", MaxAltTextLength);
        return errors.Count > 0
            ? ValidatedResult.Invalid(errors)
            : ValidatedResult.From(await imageRepository.UpdateImageByAltTextAsync(
                new Image { Id = imageId }, string.IsNullOrWhiteSpace(altText) ? null : altText.Trim()));
    }

    public Task<OperationResult> ReorderProjectImagesAsync(int projectId, IReadOnlyList<int> imageIdsInOrder) =>
        imageRepository.UpdateImageSortOrderAsync(projectId, imageIdsInOrder);

    public async Task<OperationResult> DeleteImageAsync(int imageId, CancellationToken cancellationToken = default)
    {
        var image = await imageRepository.GetImageByIdAsync(imageId);
        if (image is null)
        {
            return OperationResult.NotFound;
        }

        // Rækken slettes først: fejler det, beholdes filen, så billedet stadig virker.
        var result = await imageRepository.DeleteImageAsync(image);
        if (result == OperationResult.Success)
        {
            await imageStorage.DeleteAsync(image.FileName, cancellationToken);
        }

        return result;
    }

    public async Task<OperationResult> DeleteProjectImagesAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var images = await imageRepository.GetImagesByProjectsIdAsync(projectId);
        if (images.Count == 0)
        {
            return OperationResult.Success;
        }

        // Rækkerne slettes først: fejler det, beholdes filerne, så billederne stadig virker.
        var result = await imageRepository.DeleteImagesByProjectsIdAsync(projectId);
        if (result == OperationResult.Success)
        {
            foreach (var image in images)
            {
                await imageStorage.DeleteAsync(image.FileName, cancellationToken);
            }
        }

        return result;
    }

    private static async Task CopyAtMostAsync(Stream source, Stream destination, long maxBytes, CancellationToken cancellationToken)
    {
        var chunk = new byte[81920];
        long total = 0;
        int read;
        while (total < maxBytes
               && (read = await source.ReadAsync(chunk.AsMemory(0, (int)Math.Min(chunk.Length, maxBytes - total)), cancellationToken)) > 0)
        {
            await destination.WriteAsync(chunk.AsMemory(0, read), cancellationToken);
            total += read;
        }
    }

    private static string? TrimFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return null;
        }

        var name = Path.GetFileName(fileName.Trim());
        return name.Length > MaxOriginalFileNameLength ? name[..MaxOriginalFileNameLength] : name;
    }
}
