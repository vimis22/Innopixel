namespace Innopixel.Projects.Contracts.Dtos;

using Innopixel.Projects.Domain;

// Alt det, en projektside viser (US-07). Billeder hentes fra Images-modulet ud fra Project.Id.
public record ProjectDetails(
    Projects Project,
    IReadOnlyList<Technology> Technologies,
    IReadOnlyList<Category> Categories,
    int? PrimaryCategoryId,
    IReadOnlyList<Services> Services);
