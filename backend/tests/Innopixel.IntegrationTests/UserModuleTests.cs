namespace Innopixel.IntegrationTests;

using Innopixel.Shared.Results;
using Innopixel.User.Application.Interfaces;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

[Collection(DatabaseCollection.Name)]
public class UserModuleTests(DatabaseFixture db)
{
    [DatabaseFact]
    public async Task User_CanBeCreatedFoundUpdatedAndSoftDeleted()
    {
        var users = db.Get<IUserRepository>();
        var names = db.Get<IUserNameRepository>();
        var email = TestData.UniqueEmail();

        var id = await TestData.CreateUserAsync(db, email);
        var user = Assert.Single(await users.GetUserByEmailAsync(email));
        Assert.Equal(id, user.Id);

        Assert.Equal(OperationResult.Success, await names.UpdateUserByFirstnameAsync(user, "Anne"));
        Assert.Contains(await names.GetUserByFirstnameAsync("Anne"), u => u.Id == id);
        Assert.Contains(await db.Get<IUserTelephoneRepository>().GetUserByFullTelephoneAsync(45, 12345678), u => u.Id == id);
        Assert.Contains(await db.Get<IUserBirthRepository>().GetUserByBirthdayAsync(new DateTime(1990, 5, 17, 0, 0, 0, DateTimeKind.Utc)), u => u.Id == id);

        Assert.Equal(OperationResult.Success, await users.DeleteUserByAllInfoAsync(user));
        Assert.Empty(await users.GetUserByIdAsync(id));

        // En slettet bruger kan ikke opdateres.
        Assert.Equal(OperationResult.NotFound, await names.UpdateUserByFirstnameAsync(user, "Ny"));
        Assert.Equal(OperationResult.NotFound, await db.Get<IUserAddressRepository>().UpdateUserByStreetnameAsync(user, "Ny vej"));
    }

    [DatabaseFact]
    public async Task ActiveUsers_CannotShareAnEmail_ButADeletedUsersEmailCanBeReused()
    {
        var users = db.Get<IUserRepository>();
        var email = TestData.UniqueEmail();

        var first = await TestData.CreateUserAsync(db, email);
        Assert.Null(await users.CreateUserAndGetIdAsync(TestData.User(email)));

        await users.DeleteUserByAllInfoAsync(new User { Id = first });
        Assert.NotNull(await users.CreateUserAndGetIdAsync(TestData.User(email)));
    }

    [DatabaseFact]
    public async Task Location_CanBeCreatedAndAssigned()
    {
        var locations = db.Get<ILocationRepository>();
        var userLocations = db.Get<IUserLocationRepository>();
        var userId = await TestData.CreateUserAsync(db);
        var postalcode = Guid.NewGuid().ToString("N")[..8];

        Assert.Equal(OperationResult.Success, await locations.CreateLocationAsync(new LocationInfo(postalcode, "Odense", "Syddanmark", "Danmark")));
        var location = Assert.Single(await locations.GetLocationByPostalcodeAsync(postalcode));

        Assert.Equal(OperationResult.Success, await userLocations.AssignLocationToUserAsync(userId, location.Id));
        Assert.Equal(location.Id, (await userLocations.GetLocationByUserIdAsync(userId))?.Id);
        Assert.Contains(await userLocations.GetUsersByLocationIdAsync(location.Id), u => u.Id == userId);

        Assert.Equal(OperationResult.Success, await userLocations.RemoveLocationFromUserAsync(userId));
        Assert.Null(await userLocations.GetLocationByUserIdAsync(userId));
    }

    [DatabaseFact]
    public async Task Admin_GetsRights_AndAccessIsChecked_PerService()
    {
        var users = db.Get<IUserRepository>();
        var rights = db.Get<IRightsRepository>();
        var rightsLists = db.Get<IRightsListRepository>();
        var access = db.Get<IAccessService>();
        var adminId = await TestData.CreateUserAsync(db);

        Assert.Equal(OperationResult.Success, await users.AssignAdminRoleAsync(adminId));
        Assert.Equal(OperationResult.NotFound, await users.AssignAdminRoleAsync(adminId));
        Assert.Equal(adminId, (await users.GetAdminByIdAsync(adminId))?.Id);

        await rights.CreateRightsAsync(new Rights { Create = true, Read = true });
        var readWrite = (await rights.GetRightsByAllInfoAsync(true, true, false, false)).Last();

        // Samme rettighed to gange giver kun én kobling.
        Assert.Equal(OperationResult.Success, await rightsLists.UpdateRightsListByRightsAsync(adminId, [readWrite.Id, readWrite.Id]));
        Assert.Single(await rightsLists.GetRightsListByAdminIdAsync(adminId));

        Assert.True(await access.HasPermissionAsync(adminId, Permission.Create));
        Assert.False(await access.HasPermissionAsync(adminId, Permission.Delete));

        // En slettet admin har ingen rettigheder.
        await users.DeleteUserByAllInfoAsync(new User { Id = adminId });
        Assert.False(await access.HasPermissionAsync(adminId, Permission.Create));
    }

    [DatabaseFact]
    public async Task DeletingRights_RemovesItsLinks()
    {
        var users = db.Get<IUserRepository>();
        var rights = db.Get<IRightsRepository>();
        var adminId = await TestData.CreateUserAsync(db);
        await users.AssignAdminRoleAsync(adminId);
        await rights.CreateRightsAsync(new Rights { Delete = true });
        var right = (await rights.GetRightsByDeleteAsync(true)).Last();
        await db.Get<IRightsListRepository>().CreateRightsListAsync(new RightsList { AdminId = adminId, RightsId = right.Id });

        Assert.Equal(OperationResult.Success, await rights.DeleteRightsByAllInfoAsync(right));
        Assert.Empty(await db.Get<IRightsListRepository>().GetRightsListByAdminIdAsync(adminId));
        Assert.Equal(OperationResult.Success, await users.RemoveAdminRoleAsync(adminId));
    }

    [DatabaseFact]
    public async Task WorkLog_ForAnAdmin_IsLinkedFoundByDateAndDeletedWithItsLinks()
    {
        var users = db.Get<IUserRepository>();
        var workLogs = db.Get<IWorkLogRepository>();
        var workLogLists = db.Get<IWorkLogListRepository>();
        var userId = await TestData.CreateUserAsync(db);

        // Med INHERITS ville denne kobling være blevet afvist for en admin.
        await users.AssignAdminRoleAsync(userId);

        var checkin = new DateTime(2026, 10, 16, 8, 0, 0, DateTimeKind.Utc);
        Assert.Equal(OperationResult.Success, await workLogs.CreateWorkLogAsync(
            new WorkLogInfo("Frontend", new DateTime(2026, 10, 16), checkin, checkin.AddHours(8), userId)));

        var link = Assert.Single(await workLogLists.GetWorkLogListByDateRangeAsync(userId, new DateTime(2026, 10, 1), new DateTime(2026, 10, 31)));
        var workLog = Assert.Single(await workLogs.GetWorkLogByIdAsync(link.WorkLogId));
        Assert.Equal(checkin, workLog.Checkin.ToUniversalTime());

        Assert.Equal(OperationResult.Success, await workLogs.DeleteWorkLogByAllInfoAsync(workLog));
        Assert.Empty(await workLogLists.GetWorkLogListByUserIdAsync(userId));
    }

    [DatabaseFact]
    public async Task WorkLog_WithCheckoutBeforeCheckin_IsRejected()
    {
        var checkin = new DateTime(2026, 10, 16, 8, 0, 0, DateTimeKind.Utc);

        Assert.Equal(OperationResult.Failed, await db.Get<IWorkLogRepository>().CreateWorkLogAsync(
            new WorkLogInfo(null, new DateTime(2026, 10, 16), checkin, checkin.AddHours(-1), null)));
    }

    [DatabaseFact]
    public async Task ContactForm_IsSaved_HandledByAnAdmin_AndFullyDeletedOnRequest()
    {
        var contactService = db.Get<IContactService>();
        var adminMessages = db.Get<IAdminMessageRepository>();
        var users = db.Get<IUserRepository>();

        var submitted = await contactService.SubmitContactFormAsync(new ContactFormInfo("Anna Hansen", "anna@innopixel.dk", "Hvad koster en webshop?"));
        Assert.True(submitted.IsSuccess);
        var contactId = submitted.Id!.Value;

        var message = Assert.Single(await contactService.GetInquiriesByContactIdAsync(contactId));
        Assert.False(message.Disabled);
        Assert.Contains(await contactService.GetAllInquiriesAsync(), m => m.Id == message.Id);

        var adminId = await TestData.CreateUserAsync(db);
        await users.AssignAdminRoleAsync(adminId);
        Assert.Equal(OperationResult.Success, await adminMessages.AssignMessageToAdminAsync(adminId, message.Id));
        Assert.Equal(message.Id, (await adminMessages.GetMessageByAdminIdAsync(adminId))?.Id);
        Assert.Contains(await adminMessages.GetAdminsByMessageIdAsync(message.Id), a => a.Id == adminId && a.MessageId == message.Id);

        Assert.Equal(OperationResult.Success, await contactService.SetInquiryDisabledAsync(message.Id, true));

        // GDPR: kontakten, dens beskeder og admin'ens henvisning forsvinder.
        Assert.Equal(OperationResult.Success, await contactService.DeleteContactAsync(contactId));
        Assert.Null(await contactService.GetContactByIdAsync(contactId));
        Assert.Null(await adminMessages.GetMessageByAdminIdAsync(adminId));
    }

    [DatabaseFact]
    public async Task Client_CanOwnContacts()
    {
        var users = db.Get<IUserRepository>();
        var clientContacts = db.Get<IClientContactRepository>();
        var clientId = await TestData.CreateUserAsync(db);
        await users.AssignClientRoleAsync(clientId);
        var contactId = (await db.Get<IContactService>().SubmitContactFormAsync(new ContactFormInfo("Firma A/S", "firma@example.com", "Hej"))).Id!.Value;

        Assert.Equal(OperationResult.Success, await clientContacts.AssignContactToClientAsync(contactId, clientId));
        Assert.Equal(clientId, (await clientContacts.GetClientByContactIdAsync(contactId))?.Id);
        Assert.Contains(await clientContacts.GetContactsByClientIdAsync(clientId), c => c.Id == contactId);

        Assert.Equal(OperationResult.Success, await users.RemoveClientRoleAsync(clientId));
        Assert.Null(await clientContacts.GetClientByContactIdAsync(contactId));
    }
}
