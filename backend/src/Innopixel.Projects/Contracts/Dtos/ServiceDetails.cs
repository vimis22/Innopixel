namespace Innopixel.Projects.Contracts.Dtos;

using Innopixel.Projects.Domain;

// En service med dens tekster (US-05, US-18).
public record ServiceDetails(Services Service, IReadOnlyList<Languages> Texts);
