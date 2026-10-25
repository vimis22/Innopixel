namespace Innopixel.Images.Application.Interfaces;

using Innopixel.Images.Domain;
using Innopixel.Shared.Results;

public interface IImageRepository
{
    // Returnerer det nye id, eller null hvis databasen afviser rækken.
    Task<int?> CreateImageAsync(Image imageInfo);

    Task<Image?> GetImageByIdAsync(int imageId);
    Task<IReadOnlyList<Image>> GetImagesByProjectsIdAsync(int projectsId);
    Task<int> GetNextSortOrderAsync(int projectsId);

    Task<OperationResult> UpdateImageByAltTextAsync(Image image, string? altText);

    // Sætter SortOrder ud fra rækkefølgen i imageIds. Kun billeder, der tilhører projektet, påvirkes.
    Task<OperationResult> UpdateImageSortOrderAsync(int projectsId, IReadOnlyList<int> imageIds);

    Task<OperationResult> DeleteImageAsync(Image image);
    Task<OperationResult> DeleteImagesByProjectsIdAsync(int projectsId);
}
