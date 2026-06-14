using System.Security.Claims;

namespace AKNAR.API.Authorization
{
    public static class ClaimsPrincipalExtensions
    {
        public static bool TryGetUserId(this ClaimsPrincipal user, out int userId)
        {
            userId = 0;
            var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out userId);
        }

        public static bool IsStaff(this ClaimsPrincipal user)
        {
            return user.IsInRole("Admin") || user.IsInRole("Consultant");
        }
    }
}
