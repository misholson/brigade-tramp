using Azure.Communication.Email;

namespace BrigadeTramp.Api.Services;

public class EmailService(IConfiguration config)
{
    const int BccBatchSize = 50;

    public async Task SendAsync(IEnumerable<string> to, string subject, string body, string? replyTo = null)
    {
        var connectionString = config["AzureCommunicationServices:ConnectionString"]
            ?? throw new InvalidOperationException("ACS connection string not configured.");
        var fromAddress = config["AzureCommunicationServices:FromAddress"]
            ?? throw new InvalidOperationException("ACS from address not configured.");

        var recipients = to.Select(addr => new EmailAddress(addr)).ToList();
        if (recipients.Count == 0) return;

        var client = new EmailClient(connectionString);
        var content = new EmailContent(subject) { PlainText = body };
        var message = new EmailMessage(fromAddress, new EmailRecipients(recipients), content);
        if (!string.IsNullOrWhiteSpace(replyTo))
            message.ReplyTo.Add(new EmailAddress(replyTo));

        await client.SendAsync(Azure.WaitUntil.Started, message);
    }

    public async Task SendBccAsync(IEnumerable<string> bcc, string subject, string body, string? replyTo = null)
    {
        var connectionString = config["AzureCommunicationServices:ConnectionString"]
            ?? throw new InvalidOperationException("ACS connection string not configured.");
        var fromAddress = config["AzureCommunicationServices:FromAddress"]
            ?? throw new InvalidOperationException("ACS from address not configured.");

        var allAddresses = bcc
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Distinct()
            .ToList();
        if (allAddresses.Count == 0) return;

        var client = new EmailClient(connectionString);
        var content = new EmailContent(subject) { PlainText = body };

        for (int i = 0; i < allAddresses.Count; i += BccBatchSize)
        {
            var recipients = new EmailRecipients();
            foreach (var addr in allAddresses.Skip(i).Take(BccBatchSize))
                recipients.BCC.Add(new EmailAddress(addr));

            var message = new EmailMessage(fromAddress, recipients, content);
            if (!string.IsNullOrWhiteSpace(replyTo))
                message.ReplyTo.Add(new EmailAddress(replyTo));

            await client.SendAsync(Azure.WaitUntil.Started, message);
        }
    }
}
