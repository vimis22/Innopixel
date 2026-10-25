namespace Innopixel.Images.Contracts;

using Innopixel.Shared.Results;

// Projektbilleder (US-07, US-14).
public interface IImagesService
{
    // Validerer og gemmer billedet. Id i resultatet er billedets id.
    // Om projectId findes, tjekker kalderen via Projects-modulet.
    Task<ValidatedResult> UploadProjectImageAsync(
        int projectId,
        Stream content,
        string? originalFileName,
        string? altText,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ImageInfo>> GetProjectImagesAsync(int projectId);
    Task<ValidatedResult> UpdateAltTextAsync(int imageId, string? altText);
    Task<OperationResult> ReorderProjectImagesAsync(int projectId, IReadOnlyList<int> imageIdsInOrder);
    Task<OperationResult> DeleteImageAsync(int imageId, CancellationToken cancellationToken = default);

    // Sletter alle projektets billeder (rækker og filer). Kaldes, før projektet slettes via Projects-modulet,
    // så filerne ikke bliver liggende på disken.
    Task<OperationResult> DeleteProjectImagesAsync(int projectId, CancellationToken cancellationToken = default);
}
