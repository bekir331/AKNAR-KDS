using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface ISensorMlService
    {
        /// <summary>
        /// Modelin hazır olup olmadığını döner.
        /// </summary>
        bool IsModelReady();

        /// <summary>
        /// Mevcut sensör verileriyle modeli eğitir ve kaydeder.
        /// </summary>
        Dictionary<string, double> TrainModel();

        /// <summary>
        /// Verilen sensör verisine göre sulama skoru tahmini yapar.
        /// </summary>
        float PredictScore(SensorReading reading);

        /// <summary>
        /// Belirli bir bahçe için kapsamlı bir KDS raporu oluşturur.
        /// </summary>
        Task<object?> GetKdsReportAsync(int orchardId);

        /// <summary>
        /// Bahçe bazlı veya tüm geçmiş analizleri getirir.
        /// </summary>
        Task<List<object>> GetHistoryAsync(int? orchardId, int? producerId = null);
    }
}
