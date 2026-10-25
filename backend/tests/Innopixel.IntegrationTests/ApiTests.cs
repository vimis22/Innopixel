namespace Innopixel.IntegrationTests;

using System.Net;
using System.Text.Json;

// Hele kæden gennem HTTP: controller -> service -> repository -> PostgreSQL, med rigtige login-cookies.
[Collection(DatabaseCollection.Name)]
public sealed class ApiTests(DatabaseFixture db) : IDisposable
{
    private readonly InnopixelApi _api = DatabaseFixture.ServerConnectionString is null ? null! : new InnopixelApi(db);

    public void Dispose() => _api?.Dispose();

    private static string Date(int daysFromToday) => DateTime.UtcNow.Date.AddDays(daysFromToday).ToString("yyyy-MM-dd");

    private async Task<ApiClient> AdminAsync()
    {
        var admin = _api.NewClient();
        await admin.LoginAsync(InnopixelApi.AdminEmail, InnopixelApi.AdminPassword);
        return admin;
    }

    // Opretter en medarbejder og logger ind som vedkommende med den midlertidige adgangskode.
    private async Task<(ApiClient Client, string Id)> EmployeeAsync(ApiClient admin, string name = "Sara Nielsen")
    {
        var email = $"{Guid.NewGuid():N}@innopixel.dk";
        var created = await admin.ReadAsync(await admin.PostAsync("/api/workspace/users",
            new { name, email, role = "EMPLOYEE", title = "Udvikler", department = "Udvikling", phone = "+45 60 12 34 56" }), HttpStatusCode.Created);

        var employee = _api.NewClient();
        var temporary = created.GetProperty("temporaryPassword").GetString()!;
        await employee.LoginAsync(email, temporary);
        await employee.ChooseOwnPasswordAsync(temporary);
        return (employee, created.GetProperty("user").GetProperty("id").GetString()!);
    }

    private static async Task<string> CreateProjectAsync(ApiClient admin, string managerId, params string[] memberIds)
    {
        var project = await admin.ReadAsync(await admin.PostAsync("/api/workspace/projects", new
        {
            name = $"VR-træning {Guid.NewGuid():N}"[..20],
            description = "Træning i VR",
            client = "Nordsø Vind A/S",
            managerId,
            status = "ACTIVE",
            startDate = Date(-10),
            endDate = Date(30),
            imageUrl = (string?)null,
            memberIds
        }), HttpStatusCode.Created);
        return project.GetProperty("id").GetString()!;
    }

    private static object Task(string projectId, string? assigneeId, string status = "TODO", string? milestoneId = null) => new
    {
        projectId,
        title = "Byg prototype",
        description = "",
        status,
        priority = "HIGH",
        assigneeId,
        group = "Udvikling",
        startDate = Date(0),
        dueDate = Date(5),
        progress = 0,
        estimateHours = 8,
        milestoneId,
        predecessorIds = Array.Empty<string>()
    };

    [DatabaseFact]
    public async Task Login_SetsAnHttpOnlyCookie_AndLogoutEndsTheSession()
    {
        var client = _api.NewClient();

        var wrong = await client.PostAsync("/api/auth/login", new { email = InnopixelApi.AdminEmail, password = "forkert-kode" });
        await client.ExpectAsync(wrong, HttpStatusCode.Unauthorized);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Http.GetAsync("/api/workspace")).StatusCode);

        var response = await client.PostAsync("/api/auth/login", new { email = "MICHAEL@innopixel.dk", password = InnopixelApi.AdminPassword });
        var user = await client.ReadAsync(response, HttpStatusCode.OK);
        Assert.Equal("Michael Lundorff Hansen", user.GetProperty("name").GetString());
        Assert.Equal("ADMIN", user.GetProperty("role").GetString());

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"));
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookie, StringComparison.OrdinalIgnoreCase);

        Assert.Equal("michael@innopixel.dk", (await client.GetAsync("/api/auth/me")).GetProperty("email").GetString());

        await client.ExpectAsync(await client.PostAsync("/api/auth/logout", new { }), HttpStatusCode.NoContent);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.Http.GetAsync("/api/auth/me")).StatusCode);
    }

    [DatabaseFact]
    public async Task Employee_OnlySeesTheirProjects_AndCannotDoAdminWork()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var (employee, employeeId) = await EmployeeAsync(admin);

        var hidden = await CreateProjectAsync(admin, adminId);
        var shared = await CreateProjectAsync(admin, adminId, employeeId);

        var data = await employee.GetAsync("/api/workspace");
        var projectIds = data.GetProperty("projects").EnumerateArray().Select(p => p.GetProperty("id").GetString()).ToList();
        Assert.Contains(shared, projectIds);
        Assert.DoesNotContain(hidden, projectIds);

        // Medarbejderens telefon kommer pænt formateret tilbage.
        var me = data.GetProperty("users").EnumerateArray().Single(u => u.GetProperty("id").GetString() == employeeId);
        Assert.Equal("+45 60 12 34 56", me.GetProperty("phone").GetString());

        await employee.ExpectErrorAsync(
            await employee.PostAsync("/api/workspace/projects", new { name = "x", client = "y", managerId = employeeId, status = "PLANNED", startDate = Date(0), endDate = Date(1), memberIds = Array.Empty<string>() }),
            HttpStatusCode.Forbidden, "FORBIDDEN", "common.noAccess");
        await employee.ExpectErrorAsync(
            await employee.PutAsync($"/api/workspace/projects/{hidden}/archived", new { archived = true }),
            HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(
            await employee.PutAsync($"/api/workspace/users/{adminId}/active", new { active = false }),
            HttpStatusCode.Forbidden, "FORBIDDEN");
    }

    [DatabaseFact]
    public async Task Assignee_UpdatesProgress_AndTheMilestoneCompletesWithItsTasks()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var (employee, employeeId) = await EmployeeAsync(admin);
        var projectId = await CreateProjectAsync(admin, adminId, employeeId);

        await admin.ExpectAsync(await admin.PostAsync("/api/workspace/milestones",
            new { projectId, title = "Prototype klar", description = "", dueDate = Date(7), taskIds = Array.Empty<string>() }), HttpStatusCode.Created);
        var milestoneId = (await admin.GetAsync("/api/workspace")).GetProperty("milestones").EnumerateArray()
            .Single(m => m.GetProperty("projectId").GetString() == projectId).GetProperty("id").GetString()!;

        var task = await admin.ReadAsync(await admin.PostAsync("/api/workspace/tasks", Task(projectId, employeeId, milestoneId: milestoneId)), HttpStatusCode.Created);
        var taskId = task.GetProperty("id").GetString()!;

        // Den ansvarlige må opdatere status og fremdrift, men ikke resten af opgaven.
        await employee.ExpectAsync(await employee.PatchAsync($"/api/workspace/tasks/{taskId}/progress", new { status = "IN_PROGRESS", progress = 40 }), HttpStatusCode.NoContent);
        await employee.ExpectErrorAsync(await employee.PutAsync($"/api/workspace/tasks/{taskId}", Task(projectId, employeeId)), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectAsync(await employee.PutAsync($"/api/workspace/tasks/{taskId}/checklist",
            new[] { new { id = "", text = "Greb og slip", done = true }, new { id = "", text = "  ", done = false } }), HttpStatusCode.NoContent);

        var milestoneCompleted = await employee.PatchAsync($"/api/workspace/tasks/{taskId}/progress", new { status = "DONE" });
        await employee.ExpectAsync(milestoneCompleted, HttpStatusCode.NoContent);

        var data = await employee.GetAsync("/api/workspace");
        var saved = data.GetProperty("tasks").EnumerateArray().Single(t => t.GetProperty("id").GetString() == taskId);
        Assert.Equal(100, saved.GetProperty("progress").GetInt32());
        Assert.Equal("Greb og slip", Assert.Single(saved.GetProperty("checklist").EnumerateArray()).GetProperty("text").GetString());

        var milestone = data.GetProperty("milestones").EnumerateArray().Single(m => m.GetProperty("id").GetString() == milestoneId);
        Assert.NotEqual(JsonValueKind.Null, milestone.GetProperty("completedAt").ValueKind);

        var messages = data.GetProperty("activity").EnumerateArray().Select(a => a.GetProperty("message").GetString()).ToList();
        Assert.Contains("flyttede \"Byg prototype\" til Færdig", messages);
        Assert.Contains("fuldførte milepælen \"Prototype klar\"", messages);

        // Milepæle med opgaver følger opgaverne og kan ikke ændres manuelt.
        await admin.ExpectErrorAsync(await admin.PutAsync($"/api/workspace/milestones/{milestoneId}/completed", new { completed = false }), HttpStatusCode.Forbidden, "FORBIDDEN");
    }

    [DatabaseFact]
    public async Task InvalidInput_ReturnsTheMessageKeyTheFrontendShows()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var projectId = await CreateProjectAsync(admin, adminId);

        await admin.ExpectErrorAsync(
            await admin.PostAsync("/api/workspace/projects", new { name = "P", client = "K", managerId = adminId, status = "ACTIVE", startDate = Date(5), endDate = Date(1), memberIds = Array.Empty<string>() }),
            HttpStatusCode.BadRequest, "VALIDATION", "projects.validation.endBeforeStart");
        await admin.ExpectErrorAsync(
            await admin.PostAsync("/api/workspace/projects", new { name = "P", client = "K", managerId = adminId, status = "ACTIVE", startDate = Date(0), endDate = Date(1), imageUrl = "javascript:alert(1)", memberIds = Array.Empty<string>() }),
            HttpStatusCode.BadRequest, "VALIDATION", "projects.validation.imageInvalid");

        // En ikke-medlem kan ikke være ansvarlig, og afhængigheder må ikke danne en ring.
        var (_, outsiderId) = await EmployeeAsync(admin, "Udenforstående");
        await admin.ExpectErrorAsync(await admin.PostAsync("/api/workspace/tasks", Task(projectId, outsiderId)), HttpStatusCode.BadRequest, "VALIDATION", "tasks.validation.assigneeNotMember");

        var first = (await admin.ReadAsync(await admin.PostAsync("/api/workspace/tasks", Task(projectId, null)), HttpStatusCode.Created)).GetProperty("id").GetString()!;
        var secondInput = new Dictionary<string, object?>(JsonSerializer.Deserialize<Dictionary<string, object?>>(JsonSerializer.Serialize(Task(projectId, null)))!) { ["predecessorIds"] = new[] { first } };
        var second = (await admin.ReadAsync(await admin.PostAsync("/api/workspace/tasks", secondInput), HttpStatusCode.Created)).GetProperty("id").GetString()!;
        var cyclic = new Dictionary<string, object?>(JsonSerializer.Deserialize<Dictionary<string, object?>>(JsonSerializer.Serialize(Task(projectId, null)))!) { ["predecessorIds"] = new[] { second } };
        await admin.ExpectErrorAsync(await admin.PutAsync($"/api/workspace/tasks/{first}", cyclic), HttpStatusCode.BadRequest, "VALIDATION", "tasks.validation.dependencyCycle");

        await admin.ExpectErrorAsync(await admin.Http.DeleteAsync("/api/workspace/tasks/999999"), HttpStatusCode.NotFound, "NOT_FOUND", "errors.notFoundText");
    }

    [DatabaseFact]
    public async Task Team_ProtectsTheLastAdmin_AndDeactivationEndsAccess()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var (employee, employeeId) = await EmployeeAsync(admin);

        await admin.ExpectErrorAsync(await admin.PutAsync($"/api/workspace/users/{adminId}/active", new { active = false }),
            HttpStatusCode.BadRequest, "VALIDATION", "team.cannotDeactivateSelf");
        await admin.ExpectErrorAsync(await admin.PutAsync($"/api/workspace/users/{adminId}",
                new { name = "Michael Lundorff Hansen", email = InnopixelApi.AdminEmail, role = "EMPLOYEE", title = "Producer & partner", department = "Ledelse", phone = (string?)null }),
            HttpStatusCode.BadRequest, "VALIDATION", "team.validation.lastAdmin");

        await admin.ExpectAsync(await admin.PutAsync($"/api/workspace/users/{employeeId}/active", new { active = false }), HttpStatusCode.NoContent);
        Assert.Equal(HttpStatusCode.Unauthorized, (await employee.Http.GetAsync("/api/auth/me")).StatusCode);
    }

    [DatabaseFact]
    public async Task PublicSite_GetsTheSeededProjectsAndServices_InBothLanguages()
    {
        var visitor = _api.NewClient();

        var english = await visitor.GetAsync("/api/public/projects?lang=en");
        var danish = await visitor.GetAsync("/api/public/projects?lang=da");
        var lillebaelt = english.EnumerateArray().Single(p => p.GetProperty("title").GetString() == "Naturpark Lillebælt AR App");
        Assert.Equal("Naturpark Lillebælt", lillebaelt.GetProperty("client").GetString());
        Assert.Equal("Unity, AR Foundation, C#, Blender", lillebaelt.GetProperty("tech").GetString());
        Assert.Equal("/images/project_lillebaelt.png", lillebaelt.GetProperty("image").GetString());
        Assert.Contains("Augmented Reality", lillebaelt.GetProperty("tags").EnumerateArray().Select(t => t.GetString()));
        Assert.Equal(6, danish.EnumerateArray().Count(p => p.GetProperty("body").GetString()!.Length > 0));

        var services = await visitor.GetAsync("/api/public/services?lang=da");
        Assert.Equal(["vr", "ar", "modeling", "web"], services.EnumerateArray().Select(s => s.GetProperty("icon").GetString()).Take(4));
        Assert.Equal("Virtual Reality (VR)", services[0].GetProperty("title").GetString());
    }
}
