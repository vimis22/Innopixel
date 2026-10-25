namespace Innopixel.Tests.User;

using Innopixel.User.Application;
using Innopixel.User.Contracts;
using Innopixel.User.Contracts.Dtos;
using Innopixel.User.Domain;

public class AccessAndUserServiceTests
{
    [Fact]
    public void Grants_IsTrueWhenAnyRightHasThePermission()
    {
        Rights[] rights = [new() { Read = true }, new() { Update = true }];

        Assert.True(AccessService.Grants(rights, Permission.Read));
        Assert.True(AccessService.Grants(rights, Permission.Update));
        Assert.False(AccessService.Grants(rights, Permission.Delete));
        Assert.False(AccessService.Grants([], Permission.Read));
    }

    [Theory]
    [InlineData("Anna", "Hansen", null, true)]
    [InlineData("Anna", "Hansen", "anna@innopixel.dk", true)]
    [InlineData("Anna", "Hansen", "anna", false)]
    [InlineData("", "Hansen", null, false)]
    [InlineData("Anna", " ", null, false)]
    public void UserInfo_Validation(string firstname, string lastname, string? email, bool expected)
    {
        var info = new UserInfo(firstname, null, lastname, email, "Vej", "1", 45, 12345678,
            DateTime.UnixEpoch, DateTime.UnixEpoch, DateTime.UnixEpoch, null);

        Assert.Equal(expected, UserService.IsValid(info));
    }
}
