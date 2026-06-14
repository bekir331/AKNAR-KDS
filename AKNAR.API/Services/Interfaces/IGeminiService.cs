using System.Globalization;

namespace AKNAR.API.Services.Interfaces
{
    public interface IGeminiService
    {
        Task<string> GetRecommendationAsync(
            string diseaseName,
            double confidence,
            string staticRecommendation,
            string? sensorData,
            string? location
           );

        Task<string> GetSensorAnalysisAsync(
            string sensorSummary,
            string? location
        );

        Task<string> GetChatbotResponseAsync(string userMessage, string context);

        Task<(bool isLeaf, string message)> ValidateLeafImageAsync(byte[] imageBytes);

        Task<string> GetKdsDetailedAnalysisAsync(double mlScore, Models.SensorReading reading, string? location);
    }
}
