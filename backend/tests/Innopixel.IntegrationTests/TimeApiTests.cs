namespace Innopixel.IntegrationTests;

using System.Net;
using System.Text.Json;

// Tidsregistrering gennem HTTP mod PostgreSQL. Uret står fast på onsdag d. 18. november 2026 kl. 13:00 dansk tid
// og stilles frem i testene, så tider og totaler kan tjekkes præcist.
[Collection(DatabaseCollection.Name)]
public sealed class TimeApiTests : IDisposable
{
    private static readonly DateTimeOffset Wednesday = new(2026, 11, 18, 12, 0, 0, TimeSpan.Zero);

    private readonly DatabaseFixture _db;
    private readonly InnopixelApi _api;

    public TimeApiTests(DatabaseFixture db)
    {
        _db = db;
        _api = DatabaseFixture.ServerConnectionString is null ? null! : new InnopixelApi(db);
        _api?.Clock.Set(Wednesday);
    }

    public void Dispose() => _api?.Dispose();

    private async Task<ApiClient> AdminAsync()
    {
        var admin = _api.NewClient();
        await admin.LoginAsync(InnopixelApi.AdminEmail, InnopixelApi.AdminPassword);
        return admin;
    }

    private async Task<(ApiClient Client, string Id)> EmployeeAsync(ApiClient admin)
    {
        var email = $"{Guid.NewGuid():N}@innopixel.dk";
        var created = await admin.ReadAsync(await admin.PostAsync("/api/workspace/users",
            new { name = "Sara Nielsen", email, role = "EMPLOYEE", title = "XR-udvikler", department = "Udvikling", phone = (string?)null, expectedWeeklyHours = 37.5 }),
            HttpStatusCode.Created);

        var employee = _api.NewClient();
        var temporary = created.GetProperty("temporaryPassword").GetString()!;
        await employee.LoginAsync(email, temporary);
        await employee.ChooseOwnPasswordAsync(temporary);
        return (employee, created.GetProperty("user").GetProperty("id").GetString()!);
    }

    private static object Manual(string date, string clockIn, string clockOut, int breakMinutes = 30, string? projectId = null, string? remarks = null) =>
        new { date, clockIn, clockOut, breakMinutes, projectId, remarks };

    [DatabaseFact]
    public async Task LiveClock_ClockInBreakAndClockOut_ArePersistedAndSurviveARefresh()
    {
        var admin = await AdminAsync();
        var (employee, employeeId) = await EmployeeAsync(admin);

        var started = await employee.ReadAsync(await employee.PostAsync("/api/time/clock-in", new { projectId = (string?)null, remarks = "Kundemøde" }), HttpStatusCode.Created);
        Assert.Equal("ACTIVE", started.GetProperty("status").GetString());
        Assert.Equal("2026-11-18", started.GetProperty("date").GetString());

        // Ingen dobbelt-stempling.
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/clock-in", new { }), HttpStatusCode.BadRequest, "VALIDATION", "time.validation.alreadyClockedIn");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/breaks/end", new { }), HttpStatusCode.BadRequest, "VALIDATION", "time.validation.notOnBreak");

        _api.Clock.Advance(TimeSpan.FromHours(2));
        await employee.ExpectAsync(await employee.PostAsync("/api/time/breaks/start", new { }), HttpStatusCode.OK);
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/breaks/start", new { }), HttpStatusCode.BadRequest, "VALIDATION", "time.validation.alreadyOnBreak");
        _api.Clock.Advance(TimeSpan.FromMinutes(30));

        // "Opdater siden": den aktive stempling og pausen kommer fra serveren.
        var during = await employee.GetAsync("/api/time/overview");
        var active = during.GetProperty("active");
        Assert.True(active.GetProperty("onBreak").GetBoolean());
        Assert.Equal(120, active.GetProperty("workedMinutes").GetInt32());
        Assert.Equal(30, active.GetProperty("breakMinutes").GetInt32());

        await employee.ExpectAsync(await employee.PostAsync("/api/time/breaks/end", new { }), HttpStatusCode.OK);
        _api.Clock.Advance(TimeSpan.FromHours(1));
        var stopped = await employee.ReadAsync(await employee.PostAsync("/api/time/clock-out", new { }), HttpStatusCode.OK);
        Assert.Equal("PENDING", stopped.GetProperty("status").GetString());
        Assert.Equal(180, stopped.GetProperty("workedMinutes").GetInt32());
        Assert.Equal(30, stopped.GetProperty("breakMinutes").GetInt32());

        var after = await employee.GetAsync("/api/time/overview");
        Assert.Equal(JsonValueKind.Null, after.GetProperty("active").ValueKind);
        Assert.Equal(180, after.GetProperty("todayMinutes").GetInt32());
        Assert.Equal(450, after.GetProperty("todayPlannedMinutes").GetInt32());   // 37,5 t / 5
        Assert.Equal(180, after.GetProperty("pendingMinutes").GetInt32());
        Assert.Equal(stopped.GetProperty("id").GetString(), after.GetProperty("latest").GetProperty("id").GetString());

        // I databasen: worklog + workloglist + én afsluttet pause.
        var id = int.Parse(stopped.GetProperty("id").GetString()!);
        Assert.Equal(30, await _db.ScalarAsync<int>("SELECT break_minutes FROM worklog WHERE id = @Id AND checkout IS NOT NULL", new { Id = id }));
        Assert.Equal(int.Parse(employeeId), await _db.ScalarAsync<int>("SELECT user_id FROM workloglist WHERE worklog_id = @Id", new { Id = id }));
        Assert.Equal(1, await _db.ScalarAsync<int>("SELECT COUNT(*)::int FROM worklogbreak WHERE worklog_id = @Id AND end_at IS NOT NULL", new { Id = id }));
        Assert.Equal("Kundemøde", await _db.ScalarAsync<string>("SELECT description FROM worklog WHERE id = @Id", new { Id = id }));
    }

    [DatabaseFact]
    public async Task ManualRegistration_HandlesMidnight_AndRejectsInvalidInput()
    {
        var admin = await AdminAsync();
        var (employee, _) = await EmployeeAsync(admin);

        // Nattevagt mandag 22:00 -> tirsdag 06:00 med 30 min pause = 7,5 timer på mandagen.
        var night = await employee.ReadAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-16", "22:00", "06:00")), HttpStatusCode.Created);
        Assert.Equal(450, night.GetProperty("workedMinutes").GetInt32());
        Assert.Equal(new DateTime(2026, 11, 16, 21, 0, 0, DateTimeKind.Utc), night.GetProperty("clockIn").GetDateTime().ToUniversalTime());
        Assert.Equal(new DateTime(2026, 11, 17, 5, 0, 0, DateTimeKind.Utc), night.GetProperty("clockOut").GetDateTime().ToUniversalTime());

        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-17", "05:00", "07:00")),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.overlap");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-10", "08:00", "09:00", breakMinutes: 60)),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.breakInvalid");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-10", "08:00", "09:00", breakMinutes: -5)),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.breakInvalid");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-10", "25:00", "09:00")),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.timeInvalid");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-19", "08:00", "16:00")),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.futureNotAllowed");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-10", "08:00", "16:00", projectId: "999999")),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.projectInvalid");
    }

    [DatabaseFact]
    public async Task Statistics_MatchThePersistedRegistrations()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var (employee, employeeId) = await EmployeeAsync(admin);

        // Et projekt, medarbejderen er med på, så tiden kan knyttes til det.
        var project = await admin.ReadAsync(await admin.PostAsync("/api/workspace/projects", new
        {
            name = "Kundeportal", description = "", client = "Kunde A/S", managerId = adminId, status = "ACTIVE",
            startDate = "2026-11-01", endDate = "2026-12-31", imageUrl = (string?)null, memberIds = new[] { employeeId }
        }), HttpStatusCode.Created);
        var projectId = project.GetProperty("id").GetString()!;

        await employee.ExpectAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-16", "08:00", "16:00", 30, projectId)), HttpStatusCode.Created); // 7,5 t
        await employee.ExpectAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-17", "08:15", "14:15", 0)), HttpStatusCode.Created);           // 6 t
        await employee.ExpectAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-18", "07:00", "12:00", 15)), HttpStatusCode.Created);          // 4,75 t
        await employee.ExpectAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-03", "09:00", "17:00", 30)), HttpStatusCode.Created);          // 7,5 t (forrige uge)

        var overview = await employee.GetAsync("/api/time/overview");
        Assert.Equal(285, overview.GetProperty("todayMinutes").GetInt32());
        Assert.Equal(450 + 360 + 285, overview.GetProperty("weekMinutes").GetInt32());
        Assert.Equal(2250, overview.GetProperty("weekPlannedMinutes").GetInt32());
        Assert.Equal(450 + 360 + 285 + 450, overview.GetProperty("pendingMinutes").GetInt32());
        // 2.-17. november har 12 arbejdsdage; 3 af dem er registreret.
        Assert.Equal(9, overview.GetProperty("missingDaysThisMonth").GetInt32());

        var week = await employee.GetAsync("/api/time/week?weekStart=2026-11-18");
        Assert.Equal("2026-11-16", week.GetProperty("weekStart").GetString());
        Assert.Equal([450, 360, 285, 0, 0, 0, 0], week.GetProperty("days").EnumerateArray().Select(d => d.GetProperty("workedMinutes").GetInt32()));
        Assert.Equal([450, 450, 450, 450, 450, 0, 0], week.GetProperty("days").EnumerateArray().Select(d => d.GetProperty("plannedMinutes").GetInt32()));

        var previous = await employee.GetAsync("/api/time/week?weekStart=2026-11-09");
        Assert.All(previous.GetProperty("days").EnumerateArray(), d => Assert.Equal(0, d.GetProperty("workedMinutes").GetInt32()));

        var registrations = await employee.GetAsync("/api/time/registrations?from=2026-11-16&to=2026-11-22");
        Assert.Equal(3, registrations.GetArrayLength());
        var monday = registrations.EnumerateArray().Single(r => r.GetProperty("date").GetString() == "2026-11-16");
        Assert.Equal("Kundeportal", monday.GetProperty("projectName").GetString());
        Assert.Equal("PENDING", monday.GetProperty("status").GetString());

        // Teamoversigten viser det samme for medarbejderen.
        var team = await admin.GetAsync("/api/time/team?weekStart=2026-11-16");
        var row = team.GetProperty("members").EnumerateArray().Single(m => m.GetProperty("userId").GetString() == employeeId);
        Assert.Equal(1095, row.GetProperty("workedMinutes").GetInt32());
        Assert.Equal(2250, row.GetProperty("expectedMinutes").GetInt32());
        Assert.Equal(0, row.GetProperty("missingDays").GetInt32());
        Assert.Equal(4, row.GetProperty("pendingCount").GetInt32());
        Assert.Equal("ON_TRACK", row.GetProperty("status").GetString());

        var pending = await admin.GetAsync($"/api/time/pending?userId={employeeId}");
        Assert.Equal(4, pending.GetArrayLength());
        Assert.All(pending.EnumerateArray(), r => Assert.Equal("PENDING", r.GetProperty("status").GetString()));
    }

    [DatabaseFact]
    public async Task Editing_UpdatesTheDatabase_AndApprovalLocksTheRegistration()
    {
        var admin = await AdminAsync();
        var (employee, _) = await EmployeeAsync(admin);

        var created = await employee.ReadAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-12", "08:00", "16:00")), HttpStatusCode.Created);
        var id = created.GetProperty("id").GetString()!;

        var updated = await employee.ReadAsync(await employee.PutAsync($"/api/time/registrations/{id}", Manual("2026-11-12", "09:00", "17:30", 45, remarks: "Glemte at stemple")), HttpStatusCode.OK);
        Assert.Equal(465, updated.GetProperty("workedMinutes").GetInt32());
        Assert.Equal(45, await _db.ScalarAsync<int>("SELECT break_minutes FROM worklog WHERE id = @Id", new { Id = int.Parse(id) }));
        Assert.Equal("Glemte at stemple", await _db.ScalarAsync<string>("SELECT description FROM worklog WHERE id = @Id", new { Id = int.Parse(id) }));
        Assert.Equal(new DateTime(2026, 11, 12, 8, 0, 0, DateTimeKind.Utc),
            (await _db.ScalarAsync<DateTime>("SELECT checkin FROM worklog WHERE id = @Id", new { Id = int.Parse(id) })).ToUniversalTime());

        // Kun administratorer godkender; derefter kan medarbejderen ikke længere rette den.
        await employee.ExpectErrorAsync(await employee.PutAsync($"/api/time/registrations/{id}/approval", new { approved = true }), HttpStatusCode.Forbidden, "FORBIDDEN");
        await admin.ExpectAsync(await admin.PutAsync($"/api/time/registrations/{id}/approval", new { approved = true }), HttpStatusCode.NoContent);
        Assert.Equal("APPROVED", await _db.ScalarAsync<string>("SELECT status FROM worklog WHERE id = @Id", new { Id = int.Parse(id) }));

        await employee.ExpectErrorAsync(await employee.PutAsync($"/api/time/registrations/{id}", Manual("2026-11-12", "08:00", "16:00")),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.approvedLocked");
        await employee.ExpectErrorAsync(await employee.Http.DeleteAsync($"/api/time/registrations/{id}"),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.approvedLocked");

        // En egen, ikke-godkendt registrering kan slettes.
        var other = (await employee.ReadAsync(await employee.PostAsync("/api/time/registrations", Manual("2026-11-13", "08:00", "12:00", 0)), HttpStatusCode.Created)).GetProperty("id").GetString()!;
        await employee.ExpectAsync(await employee.Http.DeleteAsync($"/api/time/registrations/{other}"), HttpStatusCode.NoContent);
        Assert.Equal(0, await _db.ScalarAsync<int>("SELECT COUNT(*)::int FROM worklog WHERE id = @Id", new { Id = int.Parse(other) }));
    }

    [DatabaseFact]
    public async Task Employees_CannotSeeOrChangeOtherPeoplesTime()
    {
        var admin = await AdminAsync();
        var adminId = (await admin.GetAsync("/api/auth/me")).GetProperty("id").GetString()!;
        var (employee, _) = await EmployeeAsync(admin);
        var (colleague, colleagueId) = await EmployeeAsync(admin);

        var theirs = (await colleague.ReadAsync(await colleague.PostAsync("/api/time/registrations", Manual("2026-11-11", "08:00", "16:00")), HttpStatusCode.Created))
            .GetProperty("id").GetString()!;

        await employee.ExpectErrorAsync(await employee.Http.GetAsync("/api/time/team"), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync($"/api/time/pending?userId={colleagueId}"), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync($"/api/time/registrations?from=2026-11-01&to=2026-11-30&userId={colleagueId}"), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.Http.GetAsync($"/api/time/week?userId={adminId}"), HttpStatusCode.Forbidden, "FORBIDDEN");
        await employee.ExpectErrorAsync(await employee.PutAsync($"/api/time/registrations/{theirs}", Manual("2026-11-11", "08:00", "12:00")), HttpStatusCode.NotFound, "NOT_FOUND");
        await employee.ExpectErrorAsync(await employee.Http.DeleteAsync($"/api/time/registrations/{theirs}"), HttpStatusCode.NotFound, "NOT_FOUND");
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/registrations", new { date = "2026-11-10", clockIn = "08:00", clockOut = "16:00", breakMinutes = 0, userId = colleagueId }),
            HttpStatusCode.Forbidden, "FORBIDDEN");

        // Administratoren ser kollegaens registrering, og et projekt kræver medlemskab.
        var seen = await admin.GetAsync($"/api/time/registrations?from=2026-11-01&to=2026-11-30&userId={colleagueId}");
        Assert.Equal(theirs, Assert.Single(seen.EnumerateArray()).GetProperty("id").GetString());

        var project = await admin.ReadAsync(await admin.PostAsync("/api/workspace/projects", new
        {
            name = "Hemmeligt", description = "", client = "K", managerId = adminId, status = "ACTIVE",
            startDate = "2026-11-01", endDate = "2026-12-31", imageUrl = (string?)null, memberIds = Array.Empty<string>()
        }), HttpStatusCode.Created);
        await employee.ExpectErrorAsync(await employee.PostAsync("/api/time/clock-in", new { projectId = project.GetProperty("id").GetString() }),
            HttpStatusCode.BadRequest, "VALIDATION", "time.validation.projectInvalid");

        Assert.Equal(HttpStatusCode.Unauthorized, (await _api.NewClient().Http.GetAsync("/api/time/overview")).StatusCode);
    }
}
