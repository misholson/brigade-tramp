using Azure.Communication.Email;

namespace BrigadeTramp.Api.Services;

public class EmailService(IConfiguration config)
{
    public async Task SendAsync(string to, string subject, string body)
    {
        var connectionString = config["AzureCommunicationServices:ConnectionString"]
            ?? throw new InvalidOperationException("ACS connection string not configured.");
        var fromAddress = config["AzureCommunicationServices:FromAddress"]
            ?? throw new InvalidOperationException("ACS from address not configured.");

        var client = new EmailClient(connectionString);
        var message = new EmailMessage(
            senderAddress: fromAddress,
            recipients: new EmailRecipients([new EmailAddress(to)]),
            content: new EmailContent(subject) { PlainText = body });

        await client.SendAsync(Azure.WaitUntil.Started, message);
    }
}
