using BrigadeTramp.Api.Data;
using Microsoft.EntityFrameworkCore;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using QRCoder;

namespace BrigadeTramp.Api.Endpoints;

public static class QrPdfEndpoints
{
    public static void MapQrPdfEndpoints(this WebApplication app)
    {
        app.MapGet("/api/events/{id:int}/qr-pdf", async (int id, HttpRequest request, AppDbContext db, IConfiguration config) =>
        {
            var singers = await db.Singers
                .Where(s => s.EventId == id)
                .OrderBy(s => s.LastName).ThenBy(s => s.BadgeName)
                .ToListAsync();

            if (singers.Count == 0) return Results.NotFound();

            var baseUrl = config["BaseUrl"] ?? $"{request.Scheme}://{request.Host}";
            var pdf = new PdfDocument();
            pdf.Info.Title = "Singer QR Codes";

            const int cols = 3;
            const int rows = 4;
            const int perPage = cols * rows;

            for (int pageStart = 0; pageStart < singers.Count; pageStart += perPage)
            {
                var page = pdf.AddPage();
                page.Size = PdfSharpCore.PageSize.A4;
                var gfx = XGraphics.FromPdfPage(page);

                double marginX = 20;
                double marginY = 20;
                double usableWidth = page.Width.Point - 2 * marginX;
                double usableHeight = page.Height.Point - 2 * marginY;
                double cellWidth = usableWidth / cols;
                double cellHeight = usableHeight / rows;

                var batch = singers.Skip(pageStart).Take(perPage).ToList();
                for (int i = 0; i < batch.Count; i++)
                {
                    var singer = batch[i];
                    int col = i % cols;
                    int row = i / cols;

                    double cellX = marginX + col * cellWidth;
                    double cellY = marginY + row * cellHeight;

                    var url = $"{baseUrl}/singer/{singer.Code}";
                    var qrData = new QRCodeGenerator().CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
                    var pngBytes = new PngByteQRCode(qrData).GetGraphic(5);

                    var xImage = XImage.FromStream(() => new MemoryStream(pngBytes));
                    double padding = 6;
                    double qrSize = Math.Min(cellWidth, cellHeight * 0.72) - 2 * padding;
                    double qrX = cellX + (cellWidth - qrSize) / 2;
                    double qrY = cellY + padding;

                    gfx.DrawImage(xImage, qrX, qrY, qrSize, qrSize);

                    var boldFont = new XFont("Helvetica", 9, XFontStyle.Bold);
                    var normalFont = new XFont("Helvetica", 8, XFontStyle.Regular);

                    double textY = qrY + qrSize + 3;
                    gfx.DrawString(singer.BadgeName, boldFont, XBrushes.Black,
                        new XRect(cellX, textY, cellWidth, 13), XStringFormats.TopCenter);
                    gfx.DrawString(singer.LastName, normalFont, XBrushes.Black,
                        new XRect(cellX, textY + 13, cellWidth, 11), XStringFormats.TopCenter);
                }
            }

            var pdfStream = new MemoryStream();
            pdf.Save(pdfStream, false);
            pdfStream.Position = 0;

            return Results.File(pdfStream, "application/pdf", $"qrcodes-event-{id}.pdf");
        }).RequireAuthorization();
    }
}
