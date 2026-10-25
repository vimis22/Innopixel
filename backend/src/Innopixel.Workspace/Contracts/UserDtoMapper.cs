namespace Innopixel.Workspace.Contracts;

using System.Globalization;
using Innopixel.User.Contracts;
using Innopixel.Workspace.Domain;

// En medarbejder i samme format som frontendens User (bruges af både platformen og login).
public static class UserDtoMapper
{
    public static UserDto ToDto(StaffMember user) => new(
        user.Id.ToString(CultureInfo.InvariantCulture), user.Name, user.Email,
        user.IsAdmin ? WorkspaceValues.RoleAdmin : WorkspaceValues.RoleEmployee,
        user.Title, user.Department, user.Phone, user.Active, user.CreatedAt, user.ExpectedWeeklyHours);
}
