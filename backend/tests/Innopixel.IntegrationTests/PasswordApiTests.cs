namespace Innopixel.IntegrationTests;

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

// Adgangskoder hele vejen gennem HTTP og PostgreSQL: eget skift, midlertidige adgangskoder, nulstillingslinks,
// invitationer og sessioner. E-mails opsamles af CapturingEmailSender i stedet for at gå til en SMTP-server.
[Collection(DatabaseCollection.Name)]
public sealed class PasswordApiTests(DatabaseFixture db) : IDisposable
{
    private const string NewPassword = "Helt-Ny-Kode-2027#";

    private readonly InnopixelApi _api = DatabaseFixture.ServerConnectionString is null ? null! : new InnopixelApi(db);

    public void Dispose() => _api?.Dispose();

    private async Task<ApiClient> AdminAsync()
    {
        var admin = _api.NewClient();
        await admin.LoginAsync(InnopixelApi.AdminEmail, InnopixelApi.AdminPassword);
        return admin;
    }

    // A new employee who has already replaced the temporary password
    private async Task<(ApiClient Client, string Id, string Email)> EmployeeAsync(ApiClient admin)
    {
        var email = $"{Guid.NewGuid():N}@innopixel.dk";
        var created = await admin.ReadAsync(await admin.PostAsync("/api/workspace/users",
            new { name = "Sara Nielsen", email, role = "EMPLOYEE", title = "Udvikler", department = "Udvikling", phone = (string?)null }), HttpStatusCode.Created);
        var temporary = created.GetProperty("temporaryPassword").GetString()!;
        var employee = _api.NewClient();
        await employee.LoginAsync(email, temporary);
        await employee.ChooseOwnPasswordAsync(temporary);
        return (employee, created.GetProperty("user").GetProperty("id").GetString()!, email);
    }

    private async Task<HttpStatusCode> LoginStatusAsync(string email, string password) =>
        (await _api.NewClient().Http.PostAsJsonAsync("/api/auth/login", new { email, password })).StatusCode;

    private static async Task<HttpStatusCode> StatusAsync(ApiClient client, string url) => (await client.Http.GetAsync(url)).StatusCode;

    [DatabaseFact]
    public async Task NewEmployee_MustReplaceTheTemporaryPassword_BeforeUsingThePlatform()
    {
        var admin = await AdminAsync();
        var email = $"{Guid.NewGuid():N}@innopixel.dk";
        var created = await admin.ReadAsync(await admin.PostAsync("/api/workspace/users",
            new { name = "Ny Kollega", email, role = "EMPLOYEE", title = "Designer", department = (string?)null, phone = (string?)null }), HttpStatusCode.Created);
        var temporary = created.GetProperty("temporaryPassword").GetString()!;

        var employee = _api.NewClient();
        var login = await employee.LoginAsync(email, temporary);
        Assert.True(login.GetProperty("mustChangePassword").GetBoolean());
        Assert.True((await employee.GetAsync("/api/auth/me")).GetProperty("mustChangePassword").GetBoolean());

        // Everything but choosing a new password is blocked, also for clients that skip the frontend
        await employee.ExpectErrorAsync(await employee.Http.GetAsync("/api/workspace"), HttpStatusCode.Forbidden, "PASSWORD_CHANGE_REQUIRED");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync("/api/time/overview"), HttpStatusCode.Forbidden, "PASSWORD_CHANGE_REQUIRED");

        await employee.ChooseOwnPasswordAsync(temporary);
        Assert.False((await employee.GetAsync("/api/auth/me")).GetProperty("mustChangePassword").GetBoolean());
        Assert.Equal(HttpStatusCode.OK, await StatusAsync(employee, "/api/workspace"));
        Assert.Equal(HttpStatusCode.Unauthorized, await LoginStatusAsync(email, temporary));
    }

    [DatabaseFact]
    public async Task ChangingOwnPassword_ChecksTheCurrentOne_AndEndsOtherSessions()
    {
        var admin = await AdminAsync();
        var (employee, _, email) = await EmployeeAsync(admin);
        var otherDevice = _api.NewClient();
        await otherDevice.LoginAsync(email, InnopixelApi.EmployeePassword);

        await employee.ExpectErrorAsync(await employee.PutAsync("/api/auth/password", new { currentPassword = "Forkert-Kode-123!", newPassword = NewPassword }),
            HttpStatusCode.BadRequest, "VALIDATION", "settings.password.currentWrong");
        await employee.ExpectErrorAsync(await employee.PutAsync("/api/auth/password", new { currentPassword = InnopixelApi.EmployeePassword, newPassword = "alt-for-svag" }),
            HttpStatusCode.BadRequest, "VALIDATION", "settings.password.tooWeak");
        await employee.ExpectErrorAsync(await employee.PutAsync("/api/auth/password", new { currentPassword = InnopixelApi.EmployeePassword, newPassword = InnopixelApi.EmployeePassword }),
            HttpStatusCode.BadRequest, "VALIDATION", "settings.password.sameAsCurrent");

        await employee.ExpectAsync(await employee.PutAsync("/api/auth/password", new { currentPassword = InnopixelApi.EmployeePassword, newPassword = NewPassword }), HttpStatusCode.OK);

        // This session continues with a fresh cookie; the other device is signed out
        Assert.Equal(HttpStatusCode.OK, await StatusAsync(employee, "/api/workspace"));
        Assert.Equal(HttpStatusCode.Unauthorized, await StatusAsync(otherDevice, "/api/auth/me"));
        Assert.Equal(HttpStatusCode.Unauthorized, await LoginStatusAsync(email, InnopixelApi.EmployeePassword));
        Assert.Equal(HttpStatusCode.OK, await LoginStatusAsync(email, NewPassword));
    }

    [DatabaseFact]
    public async Task AdminSetsATemporaryPassword_WithReauthentication_AndTheEmployeeMustChangeIt()
    {
        var admin = await AdminAsync();
        var (employee, employeeId, email) = await EmployeeAsync(admin);
        var url = $"/api/workspace/users/{employeeId}/temporary-password";
        const string temporary = "Midlertidig-Kode-42!";

        await admin.ExpectErrorAsync(await admin.PutAsync(url, new { password = temporary, adminPassword = "Ikke-Min-Kode-1!" }),
            HttpStatusCode.BadRequest, "VALIDATION", "team.access.adminPasswordWrong");
        await admin.ExpectErrorAsync(await admin.PutAsync(url, new { password = "svag", adminPassword = InnopixelApi.AdminPassword }),
            HttpStatusCode.BadRequest, "VALIDATION", "settings.password.tooWeak");
        Assert.Equal(HttpStatusCode.OK, await StatusAsync(employee, "/api/auth/me"));   // nothing changed yet

        await admin.ExpectAsync(await admin.PutAsync(url, new { password = temporary, adminPassword = InnopixelApi.AdminPassword }), HttpStatusCode.NoContent);

        // The employee's open sessions end, the old password stops working and the new one must be replaced
        Assert.Equal(HttpStatusCode.Unauthorized, await StatusAsync(employee, "/api/auth/me"));
        Assert.Equal(HttpStatusCode.Unauthorized, await LoginStatusAsync(email, InnopixelApi.EmployeePassword));
        var account = await admin.GetAsync($"/api/workspace/users/{employeeId}/account");
        Assert.True(account.GetProperty("mustChangePassword").GetBoolean());
        Assert.Equal(email, account.GetProperty("email").GetString());
        Assert.Equal("EMPLOYEE", account.GetProperty("role").GetString());
        Assert.False(account.TryGetProperty("password", out _));

        var again = _api.NewClient();
        Assert.True((await again.LoginAsync(email, temporary)).GetProperty("mustChangePassword").GetBoolean());
        await again.ExpectErrorAsync(await again.Http.GetAsync("/api/workspace"), HttpStatusCode.Forbidden, "PASSWORD_CHANGE_REQUIRED");
        await again.ExpectAsync(await again.PutAsync("/api/auth/password", new { currentPassword = temporary, newPassword = NewPassword }), HttpStatusCode.OK);
        Assert.Equal(HttpStatusCode.OK, await StatusAsync(again, "/api/workspace"));

        account = await admin.GetAsync($"/api/workspace/users/{employeeId}/account");
        Assert.False(account.GetProperty("mustChangePassword").GetBoolean());
        Assert.NotEqual(JsonValueKind.Null, account.GetProperty("lastLoginAt").ValueKind);
    }

    [DatabaseFact]
    public async Task OnlyAdministrators_ManagePasswords_AndNeverTheirOwnThroughTheTeamPage()
    {
        var admin = await AdminAsync();
        var (employee, employeeId, _) = await EmployeeAsync(admin);
        var (_, colleagueId, _) = await EmployeeAsync(admin);
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString();

        await employee.ExpectErrorAsync(await employee.PutAsync($"/api/workspace/users/{colleagueId}/temporary-password",
            new { password = "Overtag-Kontoen-1!", adminPassword = InnopixelApi.EmployeePassword }), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.PostAsync($"/api/workspace/users/{colleagueId}/password-reset-email", new { }), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync($"/api/workspace/users/{colleagueId}/account"), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync("/api/workspace/email-status"), HttpStatusCode.Forbidden, "FORBIDDEN");

        var anonymous = _api.NewClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PutAsync($"/api/workspace/users/{employeeId}/temporary-password",
            new { password = "Overtag-Kontoen-1!", adminPassword = "x" })).StatusCode);

        await admin.ExpectErrorAsync(await admin.PutAsync($"/api/workspace/users/{adminId}/temporary-password",
            new { password = "Ny-Admin-Kode-2026!", adminPassword = InnopixelApi.AdminPassword }), HttpStatusCode.BadRequest, "VALIDATION", "team.access.notOwnAccount");
        Assert.Equal(HttpStatusCode.OK, await LoginStatusAsync(InnopixelApi.AdminEmail, InnopixelApi.AdminPassword));
    }

    [DatabaseFact]
    public async Task ResetEmail_FromAnAdministrator_LetsTheEmployeeChooseANewPasswordOnce()
    {
        var admin = await AdminAsync();
        var (employee, employeeId, email) = await EmployeeAsync(admin);

        await admin.ExpectAsync(await admin.PostAsync($"/api/workspace/users/{employeeId}/password-reset-email", new { }), HttpStatusCode.Accepted);

        var mail = _api.Emails.Sent.Last(m => m.ToAddress == email);
        Assert.Equal("Innopixel — Nulstil din adgangskode", mail.Subject);
        Assert.Contains("https://studio.test/nulstil-adgangskode#token=", mail.TextBody);
        Assert.Contains("60 minutter", mail.HtmlBody);
        Assert.DoesNotContain(InnopixelApi.EmployeePassword, mail.TextBody + mail.HtmlBody);
        var token = _api.Emails.LatestToken(email);

        var visitor = _api.NewClient();
        var info = await visitor.ReadAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token }), HttpStatusCode.OK);
        Assert.Equal("RESET", info.GetProperty("purpose").GetString());

        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset", new { token, newPassword = "svag" }),
            HttpStatusCode.BadRequest, "VALIDATION", "settings.password.tooWeak");
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/reset", new { token, newPassword = NewPassword }), HttpStatusCode.NoContent);

        // All sessions end; only the new password works; the link is used up
        Assert.Equal(HttpStatusCode.Unauthorized, await StatusAsync(employee, "/api/auth/me"));
        Assert.Equal(HttpStatusCode.Unauthorized, await LoginStatusAsync(email, InnopixelApi.EmployeePassword));
        Assert.Equal(HttpStatusCode.OK, await LoginStatusAsync(email, NewPassword));
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset", new { token, newPassword = "Endnu-En-Kode-9!" }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.used");
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.used");
    }

    [DatabaseFact]
    public async Task ForgotPassword_IsNeutral_ExpiresAfterAnHour_AndOnlyTheNewestUseCounts()
    {
        var admin = await AdminAsync();
        var (_, _, email) = await EmployeeAsync(admin);
        var visitor = _api.NewClient();

        // Unknown addresses get the same answer and no e-mail
        var before = _api.Emails.Sent.Count;
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email = "findes-ikke@innopixel.dk" }), HttpStatusCode.Accepted);
        Assert.Equal(before, _api.Emails.Sent.Count);

        // Upper case and spaces don't matter
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email = $"  {email.ToUpperInvariant()} " }), HttpStatusCode.Accepted);
        var first = _api.Emails.LatestToken(email);
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email }), HttpStatusCode.Accepted);
        var second = _api.Emails.LatestToken(email);
        Assert.NotEqual(first, second);

        // At most three links per 15 minutes; the fourth request is answered the same way but sends nothing
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email }), HttpStatusCode.Accepted);
        var third = _api.Emails.LatestToken(email);
        var sent = _api.Emails.Sent.Count;
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email }), HttpStatusCode.Accepted);
        Assert.Equal(sent, _api.Emails.Sent.Count);

        // Using one link invalidates the others
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/reset", new { token = second, newPassword = NewPassword }), HttpStatusCode.NoContent);
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset", new { token = first, newPassword = "Endnu-En-Kode-9!" }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.used");
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token = third }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.used");

        // A new link after 15 minutes, which expires after 60
        _api.Clock.Advance(TimeSpan.FromMinutes(16));
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email }), HttpStatusCode.Accepted);
        var late = _api.Emails.LatestToken(email);
        _api.Clock.Advance(TimeSpan.FromMinutes(61));
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token = late }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.expired");
        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset", new { token = late, newPassword = "Endnu-En-Kode-9!" }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.expired");
        Assert.Equal(HttpStatusCode.OK, await LoginStatusAsync(email, NewPassword));

        await visitor.ExpectErrorAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token = "et-helt-forkert-link" }),
            HttpStatusCode.BadRequest, "VALIDATION", "auth.reset.invalid");
    }

    [DatabaseFact]
    public async Task ForgotPassword_IsRateLimitedPerAddress()
    {
        using var limited = new InnopixelApi(db, passwordResetPerMinute: 5);
        var visitor = limited.NewClient();
        for (var i = 0; i < 5; i++)
        {
            await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/forgot", new { email = $"x{i}@innopixel.dk" }), HttpStatusCode.Accepted);
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, (await visitor.PostAsync("/api/auth/password/forgot", new { email = "x@innopixel.dk" })).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await visitor.PostAsync("/api/auth/password/reset", new { token = "gæt", newPassword = NewPassword })).StatusCode);
    }

    [DatabaseFact]
    public async Task OnlyHashes_AreStored_ForPasswordsAndLinks()
    {
        var admin = await AdminAsync();
        var (_, employeeId, email) = await EmployeeAsync(admin);
        await admin.ExpectAsync(await admin.PostAsync($"/api/workspace/users/{employeeId}/password-reset-email", new { }), HttpStatusCode.Accepted);
        var token = _api.Emails.LatestToken(email);
        var id = int.Parse(employeeId);

        var passwordHash = await db.ScalarAsync<string>("SELECT password_hash FROM employee WHERE id = @id", new { id });
        Assert.DoesNotContain(InnopixelApi.EmployeePassword, passwordHash);
        Assert.StartsWith("AQAAAA", passwordHash);   // ASP.NET Core Identity v3 format (PBKDF2 with a salt)

        var storedToken = await db.ScalarAsync<byte[]>(
            "SELECT token_hash FROM password_reset_token WHERE employee_id = @id ORDER BY id DESC LIMIT 1", new { id });
        Assert.Equal(32, storedToken!.Length);
        Assert.Equal(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)), storedToken);
        Assert.Equal(0, await db.ScalarAsync<long>("SELECT count(*) FROM password_reset_token WHERE encode(token_hash, 'escape') LIKE '%' || @token || '%'", new { token }));
    }

    [DatabaseFact]
    public async Task Email_Failures_AreReported_AndLeaveNoUsableLink()
    {
        var admin = await AdminAsync();
        var (_, employeeId, email) = await EmployeeAsync(admin);

        _api.Emails.Fail = true;
        await admin.ExpectErrorAsync(await admin.PostAsync($"/api/workspace/users/{employeeId}/password-reset-email", new { }),
            HttpStatusCode.BadRequest, "VALIDATION", "team.access.emailFailed");
        Assert.Equal(0, await db.ScalarAsync<long>(
            "SELECT count(*) FROM password_reset_token WHERE employee_id = @id AND used_at IS NULL", new { id = int.Parse(employeeId) }));

        _api.Emails.Fail = false;
        _api.Emails.IsConfigured = false;
        Assert.False((await admin.GetAsync("/api/workspace/email-status")).GetProperty("configured").GetBoolean());
        await admin.ExpectErrorAsync(await admin.PostAsync($"/api/workspace/users/{employeeId}/password-reset-email", new { }),
            HttpStatusCode.BadRequest, "VALIDATION", "team.access.emailNotConfigured");
        Assert.DoesNotContain(_api.Emails.Sent, m => m.ToAddress == email);
    }

    [DatabaseFact]
    public async Task Invitation_InsteadOfATemporaryPassword_LetsTheNewEmployeeChooseOne()
    {
        var admin = await AdminAsync();
        var email = $"{Guid.NewGuid():N}@innopixel.dk";
        var created = await admin.ReadAsync(await admin.PostAsync("/api/workspace/users",
            new { name = "Ida Holm", email, role = "EMPLOYEE", title = "3D-artist", department = (string?)null, phone = (string?)null, sendInvitation = true }), HttpStatusCode.Created);
        Assert.True(created.GetProperty("invitationSent").GetBoolean());
        Assert.Equal(JsonValueKind.Null, created.GetProperty("temporaryPassword").ValueKind);

        var mail = _api.Emails.Sent.Last(m => m.ToAddress == email);
        Assert.Equal("Innopixel — Velkommen til Innopixel Studio", mail.Subject);
        var token = _api.Emails.LatestToken(email);

        var visitor = _api.NewClient();
        Assert.Equal("INVITE", (await visitor.ReadAsync(await visitor.PostAsync("/api/auth/password/reset/validate", new { token }), HttpStatusCode.OK))
            .GetProperty("purpose").GetString());
        await visitor.ExpectAsync(await visitor.PostAsync("/api/auth/password/reset", new { token, newPassword = NewPassword }), HttpStatusCode.NoContent);

        var employee = _api.NewClient();
        Assert.False((await employee.LoginAsync(email, NewPassword)).GetProperty("mustChangePassword").GetBoolean());
        Assert.Equal(HttpStatusCode.OK, await StatusAsync(employee, "/api/workspace"));
    }
}
