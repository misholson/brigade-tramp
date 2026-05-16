using Azure.Communication.Email;

namespace BrigadeTramp.Api.Services;

public class EmailService(IConfiguration config)
{
    public async Task SendAsync(IEnumerable<string> to, string subject, string body)
    {
        var connectionString = config["AzureCommunicationServices:ConnectionString"]
            ?? throw new InvalidOperationException("ACS connection string not configured.");
        var fromAddress = config["AzureCommunicationServices:FromAddress"]
            ?? throw new InvalidOperationException("ACS from address not configured.");

        var recipients = to.Select(addr => new EmailAddress(addr)).ToList();
        if (recipients.Count == 0) return;

        var client = new EmailClient(connectionString);
        var message = new EmailMessage(
            senderAddress: fromAddress,
            recipients: new EmailRecipients(recipients),
            content: new EmailContent(subject) { PlainText = body });

        await client.SendAsync(Azure.WaitUntil.Started, message);
    }
}
