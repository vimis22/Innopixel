namespace Innopixel.User.Infrastructure;

using Dapper;
using Innopixel.Shared.Data;
using Innopixel.User.Application;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;

// En medarbejder = "user" + name + (telephone) + employee, og admin hvis administrator.
public class StaffRepository(IDbConnectionFactory connectionFactory)
    : RepositoryBase(connectionFactory), IStaffRepository
{
    private const string SelectStaff = """
        SELECT u.id, u.email, e.title, e.department, e.active, e.created_at, e.password_hash, e.expected_weekly_hours,
               e.must_change_password, e.security_stamp, e.last_login_at,
               n.firstname, n.middlename, n.lastname, t.countrycode, t.phonenumber,
               (a.id IS NOT NULL) AS is_admin
        FROM employee e
        JOIN "user" u ON u.id = e.id
        JOIN name n ON n.id = u.name_id
        LEFT JOIN telephone t ON t.id = u.telephone_id
        LEFT JOIN admin a ON a.id = e.id
        WHERE u.deleted_at IS NULL
        """;

    public async Task<IReadOnlyList<StaffMember>> GetAllAsync() =>
        (await QueryAsync<StaffRow>($"{SelectStaff} ORDER BY n.firstname, n.lastname")).Select(r => r.ToStaff()).ToList();

    public async Task<StaffMember?> GetByIdAsync(int employeeId) =>
        (await GetCredentialsByIdAsync(employeeId))?.Staff;

    public async Task<StaffCredentials?> GetCredentialsByEmailAsync(string email) =>
        (await QuerySingleAsync<StaffRow>($"{SelectStaff} AND lower(u.email) = lower(@Email)", new { Email = email.Trim() }))?.ToCredentials();

    public async Task<StaffCredentials?> GetCredentialsByIdAsync(int employeeId) =>
        (await QuerySingleAsync<StaffRow>($"{SelectStaff} AND e.id = @Id", new { Id = employeeId }))?.ToCredentials();

    public async Task<bool> IsEmailInUseAsync(string email, int? exceptUserId) =>
        await QuerySingleAsync<bool>(
            """
            SELECT EXISTS (
                SELECT 1 FROM "user"
                WHERE lower(email) = lower(@Email) AND deleted_at IS NULL AND (@ExceptId IS NULL OR id <> @ExceptId))
            """,
            new { Email = email.Trim(), ExceptId = exceptUserId });

    public async Task<int> CreateAsync(StaffRecord staff, string passwordHash, bool mustChangePassword)
    {
        using var connection = ConnectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(
            """
            WITH n AS (
                     INSERT INTO name (firstname, middlename, lastname) VALUES (@Firstname, @Middlename, @Lastname) RETURNING id),
                 t AS (
                     INSERT INTO telephone (countrycode, phonenumber)
                     SELECT @Countrycode, @Phonenumber WHERE @Countrycode IS NOT NULL RETURNING id),
                 u AS (
                     INSERT INTO "user" (email, name_id, telephone_id) SELECT @Email, n.id, (SELECT id FROM t) FROM n RETURNING id),
                 e AS (
                     INSERT INTO employee (id, title, department, password_hash, expected_weekly_hours, must_change_password)
                     SELECT u.id, @Title, @Department, @PasswordHash, COALESCE(@ExpectedWeeklyHours, 37), @MustChange FROM u RETURNING id),
                 a AS (
                     INSERT INTO admin (id) SELECT e.id FROM e WHERE @IsAdmin RETURNING id)
            SELECT id FROM e
            """,
            new
            {
                staff.Firstname, staff.Middlename, staff.Lastname, staff.Email, staff.Title, staff.Department,
                staff.Countrycode, staff.Phonenumber, staff.IsAdmin, staff.ExpectedWeeklyHours, PasswordHash = passwordHash,
                MustChange = mustChangePassword
            });
    }

    public async Task UpdateAsync(int employeeId, StaffRecord staff)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync(
            """UPDATE "user" SET email = @Email WHERE id = @Id""",
            new { Id = employeeId, staff.Email }, transaction);

        await UpdateDetailsAsync(connection, transaction, employeeId,
            staff.Firstname, staff.Middlename, staff.Lastname, staff.Title, staff.Department, staff.Countrycode, staff.Phonenumber);

        if (staff.ExpectedWeeklyHours is { } hours)
        {
            await connection.ExecuteAsync(
                "UPDATE employee SET expected_weekly_hours = @Hours WHERE id = @Id",
                new { Id = employeeId, Hours = hours }, transaction);
        }

        // Rollen: en administrator har en række i admin. Mister man rollen, fjernes også ens rettigheder.
        await connection.ExecuteAsync(
            staff.IsAdmin
                ? "INSERT INTO admin (id) VALUES (@Id) ON CONFLICT (id) DO NOTHING"
                : """
                  WITH rights AS (DELETE FROM rightslist WHERE admin_id = @Id)
                  DELETE FROM admin WHERE id = @Id
                  """,
            new { Id = employeeId }, transaction);

        transaction.Commit();
    }

    public async Task UpdateProfileAsync(int employeeId, string firstname, string? middlename, string lastname, string title, string? department, int? countrycode, long? phonenumber)
    {
        using var connection = ConnectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();
        await UpdateDetailsAsync(connection, transaction, employeeId, firstname, middlename, lastname, title, department, countrycode, phonenumber);
        transaction.Commit();
    }

    public async Task SetActiveAsync(int employeeId, bool active)
    {
        using var connection = ConnectionFactory.CreateConnection();
        await connection.ExecuteAsync("UPDATE employee SET active = @Active WHERE id = @Id", new { Id = employeeId, Active = active });
    }

    public async Task RehashPasswordAsync(int employeeId, string passwordHash)
    {
        using var connection = ConnectionFactory.CreateConnection();
        await connection.ExecuteAsync("UPDATE employee SET password_hash = @Hash WHERE id = @Id", new { Id = employeeId, Hash = passwordHash });
    }

    public async Task<Guid> ReplacePasswordAsync(int employeeId, string passwordHash, bool mustChangePassword)
    {
        using var connection = ConnectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<Guid>(
            """
            UPDATE employee SET password_hash = @Hash, must_change_password = @MustChange, security_stamp = gen_random_uuid()
            WHERE id = @Id
            RETURNING security_stamp
            """,
            new { Id = employeeId, Hash = passwordHash, MustChange = mustChangePassword });
    }

    public async Task RecordLoginAsync(int employeeId, DateTime at)
    {
        using var connection = ConnectionFactory.CreateConnection();
        await connection.ExecuteAsync("UPDATE employee SET last_login_at = @At WHERE id = @Id", new { Id = employeeId, At = at });
    }

    // Navn, stilling, afdeling og telefon. Telefonrækken oprettes, opdateres eller fjernes efter behov.
    private static async Task UpdateDetailsAsync(
        System.Data.IDbConnection connection, System.Data.IDbTransaction transaction, int employeeId,
        string firstname, string? middlename, string lastname, string title, string? department, int? countrycode, long? phonenumber)
    {
        await connection.ExecuteAsync(
            """
            UPDATE name n SET firstname = @Firstname, middlename = @Middlename, lastname = @Lastname
            FROM "user" u WHERE u.name_id = n.id AND u.id = @Id
            """,
            new { Id = employeeId, Firstname = firstname, Middlename = middlename, Lastname = lastname }, transaction);

        await connection.ExecuteAsync(
            "UPDATE employee SET title = @Title, department = @Department WHERE id = @Id",
            new { Id = employeeId, Title = title, Department = department }, transaction);

        if (countrycode is null || phonenumber is null)
        {
            await connection.ExecuteAsync(
                """
                WITH old AS (SELECT telephone_id FROM "user" WHERE id = @Id),
                     cleared AS (UPDATE "user" SET telephone_id = NULL WHERE id = @Id)
                DELETE FROM telephone WHERE id = (SELECT telephone_id FROM old)
                """,
                new { Id = employeeId }, transaction);
            return;
        }

        var updated = await connection.ExecuteAsync(
            """
            UPDATE telephone t SET countrycode = @Countrycode, phonenumber = @Phonenumber
            FROM "user" u WHERE u.telephone_id = t.id AND u.id = @Id
            """,
            new { Id = employeeId, Countrycode = countrycode, Phonenumber = phonenumber }, transaction);

        if (updated == 0)
        {
            await connection.ExecuteAsync(
                """
                WITH t AS (INSERT INTO telephone (countrycode, phonenumber) VALUES (@Countrycode, @Phonenumber) RETURNING id)
                UPDATE "user" SET telephone_id = (SELECT id FROM t) WHERE id = @Id
                """,
                new { Id = employeeId, Countrycode = countrycode, Phonenumber = phonenumber }, transaction);
        }
    }

    private sealed class StaffRow
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Department { get; set; }
        public bool Active { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? PasswordHash { get; set; }
        public decimal ExpectedWeeklyHours { get; set; }
        public bool MustChangePassword { get; set; }
        public Guid SecurityStamp { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public string Firstname { get; set; } = string.Empty;
        public string? Middlename { get; set; }
        public string Lastname { get; set; } = string.Empty;
        public int? Countrycode { get; set; }
        public long? Phonenumber { get; set; }
        public bool IsAdmin { get; set; }

        public StaffMember ToStaff() => new(
            Id, StaffFormat.JoinName(Firstname, Middlename, Lastname), Email, IsAdmin, Title, Department,
            StaffFormat.FormatPhone(Countrycode, Phonenumber), Active, DateTime.SpecifyKind(CreatedAt, DateTimeKind.Utc), ExpectedWeeklyHours);

        public StaffCredentials ToCredentials() => new(
            ToStaff(), PasswordHash, MustChangePassword, SecurityStamp,
            LastLoginAt is { } at ? DateTime.SpecifyKind(at, DateTimeKind.Utc) : null);
    }
}
