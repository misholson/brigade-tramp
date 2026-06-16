using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace BrigadeTramp.Api.Endpoints;

public static class PdfMergeEndpoints
{
    public static void MapPdfMergeEndpoints(this WebApplication app)
    {
        app.MapPost("/api/pdf/merge", async (HttpRequest request, HttpContext ctx) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest("Expected multipart/form-data");

            var form = await request.ReadFormAsync();
            var files = form.Files;

            if (files.Count < 1)
                return Results.BadRequest("At least one PDF file is required");

            var output = new PdfDocument();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                ms.Position = 0;

                try
                {
                    var inputDoc = PdfReader.Open(ms, PdfDocumentOpenMode.Import);
                    foreach (var page in inputDoc.Pages)
                        output.AddPage(page);
                }
                catch
                {
                    return Results.BadRequest($"'{file.FileName}' could not be read as a PDF");
                }
            }

            if (output.PageCount == 0)
                return Results.BadRequest("No valid PDF pages found");

            var resultStream = new MemoryStream();
            output.Save(resultStream, false);
            resultStream.Position = 0;

            return Results.File(resultStream, "application/pdf", "merged.pdf");
        })
        .RequireAuthorization()
        .DisableAntiforgery();
    }
}
