using Microsoft.AspNetCore.Diagnostics;

namespace AKNAR.API.Middleware
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly IHostEnvironment _env;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "Islenmeyen istisna");

            var statusCode = StatusCodes.Status500InternalServerError;
            if (exception is InvalidOperationException)
                statusCode = StatusCodes.Status400BadRequest;
            else if (exception is UnauthorizedAccessException)
                statusCode = StatusCodes.Status401Unauthorized;
            else if (exception is KeyNotFoundException)
                statusCode = StatusCodes.Status404NotFound;

            httpContext.Response.StatusCode = statusCode;

            var message = statusCode == StatusCodes.Status500InternalServerError && !_env.IsDevelopment()
                ? "Sunucu hatası."
                : exception.Message;

            await httpContext.Response.WriteAsJsonAsync(
                new
                {
                    error = message,
                    detail = _env.IsDevelopment() ? exception.ToString() : null
                },
                cancellationToken: cancellationToken);

            return true;
        }
    }
}
