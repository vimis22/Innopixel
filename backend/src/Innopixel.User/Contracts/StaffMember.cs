namespace Innopixel.User.Contracts;

// En medarbejder i Innopixel Studio (tabellen employee). IsAdmin = har en række i admin.
public record StaffMember(
    int Id,
    string Name,
    string Email,
    bool IsAdmin,
    string Title,
    string? Department,
    string? Phone,
    bool Active,
    DateTime CreatedAt,
    decimal ExpectedWeeklyHours);

// Det, en administrator angiver, når en medarbejder oprettes eller redigeres.
// ExpectedWeeklyHours: planlagte timer pr. uge (null = uændret / standard 37).
public record StaffInput(string Name, string Email, bool IsAdmin, string Title, string? Department, string? Phone, decimal? ExpectedWeeklyHours = null);

// Det, en medarbejder selv må ændre (aldrig rolle eller email).
public record ProfileInput(string Name, string Title, string? Department, string? Phone);

public enum LoginOutcome
{
    Success,
    InvalidCredentials,
    Inactive
}

// On success: the employee and the session data that goes into the login cookie
public record LoginResult(LoginOutcome Outcome, StaffMember? Staff, StaffSession? Session = null);
