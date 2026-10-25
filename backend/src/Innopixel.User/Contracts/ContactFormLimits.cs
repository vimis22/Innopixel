namespace Innopixel.User.Contracts;

// Grænser for kontaktformularen. Ligger i Contracts, så andre moduler (f.eks. chatbotten) kan overholde dem.
public static class ContactFormLimits
{
    public const int MaxFullnameLength = 200;
    public const int MaxMessageLength = 5000;
    public const int MaxAddressLength = 300;
    public const int MaxRegistrationLength = 100;
}
