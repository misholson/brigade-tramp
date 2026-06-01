using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using BrigadeTramp.Api.DTOs;
using BrigadeTramp.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BrigadeTramp.Api.Services;

public class JwtService(IConfiguration config)
{
    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var eventRoles = user.EventRoles
            .Select(r => new EventRoleDto(r.EventId, r.Role.ToString()))
            .ToList();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("email", user.Email),
            new("name", user.Name),
            new("is_site_admin", user.IsSiteAdmin ? "true" : "false"),
            new("event_roles", JsonSerializer.Serialize(eventRoles)),
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public UserInfoDto ToUserInfo(User user) => new(
        user.Id,
        user.Email,
        user.Name,
        user.IsSiteAdmin,
        user.EventRoles.Select(r => new EventRoleDto(r.EventId, r.Role.ToString())).ToList()
    );
}
