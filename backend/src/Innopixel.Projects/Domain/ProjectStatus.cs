namespace Innopixel.Projects.Domain;

// Gyldige værdier for PROJECTS.CURRENTSTATUS.
public static class ProjectStatus
{
    public const string Draft = "Draft";
    public const string Published = "Published";

    public static bool IsValid(string? status) => status is Draft or Published;
}
