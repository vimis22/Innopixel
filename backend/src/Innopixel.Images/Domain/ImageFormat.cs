namespace Innopixel.Images.Domain;

// De billedformater, der må uploades, genkendt på filens første bytes ("magic bytes").
public sealed record ImageFormat(string ContentType, string Extension)
{
    public static readonly ImageFormat Jpeg = new("image/jpeg", ".jpg");
    public static readonly ImageFormat Png = new("image/png", ".png");
    public static readonly ImageFormat WebP = new("image/webp", ".webp");

    public static IReadOnlyList<ImageFormat> All { get; } = [Jpeg, Png, WebP];

    // Antal bytes, der skal læses for at kunne genkende alle formater.
    public const int HeaderLength = 12;

    // Genkender formatet ud fra filens indhold. Returnerer null, hvis det ikke er et tilladt billede.
    public static ImageFormat? Detect(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return Jpeg;
        }

        if (header.Length >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
        {
            return Png;
        }

        if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
        {
            return WebP;
        }

        return null;
    }
}
