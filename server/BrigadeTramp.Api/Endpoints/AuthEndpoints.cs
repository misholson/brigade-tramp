namespace BrigadeTramp.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        app.MapPost("/api/auth/login", (LoginDto dto, IConfiguration config) =>
        {
            var adminPassword = config["AdminPassword"] ?? "";
            if (dto.Username == "admin" && dto.Password == adminPassword)
                return Results.Ok(new { success = true });
            return Results.Unauthorized();
        });
    }
}

public record LoginDto(string Username, string Password);
