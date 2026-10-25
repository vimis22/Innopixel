namespace Innopixel.Images.Infrastructure;

using Dapper;
using Innopixel.Images.Application.Interfaces;
using Innopixel.Images.Domain;
using Innopixel.Shared.Data;
using Innopixel.Shared.Results;

public class ImageRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IImageRepository
{
    public Task<int?> CreateImageAsync(Image imageInfo) =>
        InsertReturningIdAsync(
            """
            INSERT INTO image (projects_id, filename, originalfilename, contenttype, sizebytes, alttext, sortorder, uploaded_at)
            VALUES (@ProjectsId, @FileName, @OriginalFileName, @ContentType, @SizeBytes, @AltText, @SortOrder, now())
            RETURNING id
            """,
            imageInfo);

    public Task<Image?> GetImageByIdAsync(int imageId) =>
        QuerySingleAsync<Image>("SELECT * FROM image WHERE id = @ImageId", new { ImageId = imageId });

    public Task<IReadOnlyList<Image>> GetImagesByProjectsIdAsync(int projectsId) =>
        QueryAsync<Image>(
            "SELECT * FROM image WHERE projects_id = @ProjectsId ORDER BY sortorder, id",
            new { ProjectsId = projectsId });

    public async Task<int> GetNextSortOrderAsync(int projectsId) =>
        await QuerySingleAsync<int>(
            "SELECT COALESCE(MAX(sortorder) + 1, 0) FROM image WHERE projects_id = @ProjectsId",
            new { ProjectsId = projectsId });

    public Task<OperationResult> UpdateImageByAltTextAsync(Image image, string? altText) =>
        ExecuteAsync("UPDATE image SET alttext = @AltText WHERE id = @Id", new { image.Id, AltText = altText });

    public Task<OperationResult> UpdateImageSortOrderAsync(int projectsId, IReadOnlyList<int> imageIds) =>
        InTransactionAsync(async (connection, transaction) =>
        {
            await connection.ExecuteAsync(
                "UPDATE image SET sortorder = @SortOrder WHERE id = @Id AND projects_id = @ProjectsId",
                imageIds.Distinct().Select((id, index) => new { Id = id, SortOrder = index, ProjectsId = projectsId }),
                transaction);
        });

    public Task<OperationResult> DeleteImageAsync(Image image) =>
        ExecuteAsync("DELETE FROM image WHERE id = @Id", new { image.Id });

    public Task<OperationResult> DeleteImagesByProjectsIdAsync(int projectsId) =>
        ExecuteAsync("DELETE FROM image WHERE projects_id = @ProjectsId", new { ProjectsId = projectsId });
}
