namespace Innopixel.Tests.Images;

using Innopixel.Images.Application;
using Innopixel.Images.Application.Interfaces;
using Innopixel.Images.Domain;
using Innopixel.Images.Infrastructure;
using Innopixel.Shared.Results;
using NSubstitute;

public class ImagesTests
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0];
    private static readonly byte[] WebP = [.."RIFF"u8, 0, 0, 0, 0, .."WEBP"u8];
    private static readonly byte[] Exe = [(byte)'M', (byte)'Z', 0x90, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    private readonly IImageRepository _repository = Substitute.For<IImageRepository>();
    private readonly IImageStorage _storage = Substitute.For<IImageStorage>();
    private readonly ImagesService _service;

    public ImagesTests()
    {
        _storage.SaveAsync(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns("stored.png");
        _service = new ImagesService(_repository, _storage);
    }

    [Fact]
    public void Detect_RecognizesAllowedFormats_ByContent()
    {
        Assert.Equal(ImageFormat.Png, ImageFormat.Detect(Png));
        Assert.Equal(ImageFormat.Jpeg, ImageFormat.Detect(Jpeg));
        Assert.Equal(ImageFormat.WebP, ImageFormat.Detect(WebP));
        Assert.Null(ImageFormat.Detect(Exe));
        Assert.Null(ImageFormat.Detect([]));
    }

    [Fact]
    public async Task ExecutableRenamedToPng_IsRejected_AndNothingIsStored()
    {
        var result = await _service.UploadProjectImageAsync(1, new MemoryStream(Exe), "virus.png", null);

        Assert.Equal(OperationResult.InvalidInput, result.Result);
        await _storage.DidNotReceiveWithAnyArgs().SaveAsync(default!, default!);
    }

    [Fact]
    public async Task TooLargeImage_IsRejected()
    {
        var content = new byte[ImagesService.MaxSizeBytes + 1];
        Png.CopyTo(content, 0);

        var result = await _service.UploadProjectImageAsync(1, new MemoryStream(content), "big.png", null);

        Assert.Equal(OperationResult.InvalidInput, result.Result);
    }

    [Fact]
    public async Task ValidImage_IsStoredWithDetectedType()
    {
        _repository.CreateImageAsync(Arg.Any<Image>()).Returns(3);

        var result = await _service.UploadProjectImageAsync(1, new MemoryStream(Png), "C:\\fakepath\\logo.jpg", " Logo ");

        Assert.True(result.IsSuccess);
        await _storage.Received(1).SaveAsync(Arg.Any<Stream>(), ".png", Arg.Any<CancellationToken>());
        await _repository.Received(1).CreateImageAsync(Arg.Is<Image>(i =>
            i.ContentType == "image/png" && i.OriginalFileName == "logo.jpg" && i.AltText == "Logo"));
    }

    [Fact]
    public async Task FailedDatabaseInsert_RemovesTheStoredFile()
    {
        _repository.CreateImageAsync(Arg.Any<Image>()).Returns((int?)null);

        var result = await _service.UploadProjectImageAsync(1, new MemoryStream(Png), "logo.png", null);

        Assert.Equal(OperationResult.Failed, result.Result);
        await _storage.Received(1).DeleteAsync("stored.png", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task DeleteProjectImages_RemovesRowsAndFiles()
    {
        _repository.GetImagesByProjectsIdAsync(1).Returns([new Image { FileName = "a.png" }, new Image { FileName = "b.png" }]);
        _repository.DeleteImagesByProjectsIdAsync(1).Returns(OperationResult.Success);

        Assert.Equal(OperationResult.Success, await _service.DeleteProjectImagesAsync(1));
        await _storage.Received(1).DeleteAsync("a.png", Arg.Any<CancellationToken>());
        await _storage.Received(1).DeleteAsync("b.png", Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task LocalStorage_SavesDeletes_AndRejectsPathTraversal()
    {
        var root = Path.Combine(Path.GetTempPath(), "innopixel-tests-" + Guid.NewGuid().ToString("N"));

        // RootPath med afsluttende "/" skal også virke.
        var storage = new LocalImageStorage(new ImageStorageOptions { RootPath = root + "/", PublicBasePath = "/uploads/images/" });

        try
        {
            var fileName = await storage.SaveAsync(new MemoryStream(Png), ".png");
            Assert.True(File.Exists(Path.Combine(root, fileName)));
            Assert.Equal($"/uploads/images/{fileName}", storage.GetPublicUrl(fileName));

            await storage.DeleteAsync(fileName);
            Assert.False(File.Exists(Path.Combine(root, fileName)));

            await Assert.ThrowsAsync<ArgumentException>(() => storage.DeleteAsync("../appsettings.json"));
        }
        finally
        {
            if (Directory.Exists(root))
            {
                Directory.Delete(root, recursive: true);
            }
        }
    }
}
