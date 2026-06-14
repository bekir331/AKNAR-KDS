using AKNAR.API.Services.Interfaces;
using System.Text;
using System.Text.Json;
// ↑ System.Text.Json = JSON oluşturmak ve okumak için.
//   Gemini API'ye JSON gönderip JSON cevap alacağız.

namespace AKNAR.API.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
  

        private readonly string _apiKey;
      

        private readonly string _model;
        

        private readonly IGroqService _groq;
      

        private readonly ILogger<GeminiService> _logger;

        public GeminiService(IConfiguration config, IGroqService groq, ILogger<GeminiService> logger)
        {
            _httpClient = new HttpClient();
            _groq = groq;
            _logger = logger;
            _apiKey = config["Gemini:ApiKey"]
                ?? throw new InvalidOperationException(
                    "Gemini:ApiKey yapılandırmada bulunamadı. " +
                    "User Secrets ile ayarlayın: " +
                    "dotnet user-secrets set \"Gemini:ApiKey\" \"<YOUR_KEY>\"");
            _model = config["Gemini:Model"] ?? "gemini-1.5-flash";
         
        }

        public async Task<string> GetRecommendationAsync(
            string diseaseName,
            double confidence,
            string staticRecommendation,
            string? sensorData, 
            string? location)
        {
            try
            {
              
                var prompt = BuildPrompt(
                    diseaseName, confidence,
                    staticRecommendation, sensorData, location);

            
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                // ↑ Google'ın Gemini API endpoint'i.
                //   {_model} = gemini-1.5-flash
                //   ?key= = API key ile kimlik doğrulama

                // 3. Request body oluştur (Gemini'nin beklediği format)
                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.7,
                        maxOutputTokens = 4096
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
          
             
                var response = await _httpClient.PostAsync(url, content);
           

                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    // Gemini başarısız → Groq'a düş
                    var fallback = await TryGroqFallbackAsync(prompt, 0.7, 4096, nameof(GetRecommendationAsync));
                    return fallback ?? "AI öneri servisi şu anda yoğun. Statik öneriyi inceleyebilirsiniz.";
                }

                using var doc = JsonDocument.Parse(responseJson);

                var candidate = doc.RootElement.GetProperty("candidates")[0];

                var text = candidate
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                string? finishReason = null;
                if (candidate.TryGetProperty("finishReason", out var fr))
                    finishReason = fr.GetString();

                if (finishReason == "MAX_TOKENS")
                    text += "\n\n[Not: Cevap token limitine takıldı, kısmen gösteriliyor.]";

                return text ?? "Öneri üretilemedi.";
            }
            catch (Exception)
            {
                // Gemini tamamen erişilemez → Groq'a düş
                var prompt2 = BuildPrompt(diseaseName, confidence, staticRecommendation, sensorData, location);
                var fallback = await TryGroqFallbackAsync(prompt2, 0.7, 4096, nameof(GetRecommendationAsync));
                return fallback ?? "AI öneri servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
            }
        }

        private string BuildPrompt(
            string diseaseName,
            double confidence,
            string staticRecommendation,
            string? sensorData,
            string? location)
     
        {
            var sb = new StringBuilder();
            

            sb.AppendLine("Sen bir narenciye hastalık danışmanısın.");
            sb.AppendLine("Türkçe ve anlaşılır bir dilde cevap ver.");
            sb.AppendLine("Sadece tarımsal bilgi ver, başka konu hakkında konuşma.");
            sb.AppendLine();
         

            sb.AppendLine($"TESPİT EDİLEN HASTALIK: {diseaseName}");
            sb.AppendLine($"GÜVENLİK SKORU: %{confidence:F1}");
            
            sb.AppendLine();

            sb.AppendLine("MEVCUT ÖNERİ (temel bilgi):");
            sb.AppendLine(staticRecommendation);
            sb.AppendLine();
          

            if (!string.IsNullOrEmpty(sensorData))
            {
                sb.AppendLine("SENSÖR VERİLERİ:");
                sb.AppendLine(sensorData);
                sb.AppendLine();
            }

            if (!string.IsNullOrEmpty(location))
            {
                sb.AppendLine($"BAHÇE KONUMU: {location}");
                sb.AppendLine();
            }

            sb.AppendLine($"MEVSİM: {GetCurrentSeason()}");
            sb.AppendLine();
          

            sb.AppendLine("Lütfen şu başlıklarda detaylı öneri ver:");
            sb.AppendLine("1. DURUM DEĞERLENDİRMESİ");
            sb.AppendLine("2. ACİL YAPILMASI GEREKENLER");
            sb.AppendLine("3. TEDAVİ PROGRAMI");
            sb.AppendLine("4. KORUYUCU ÖNLEMLER");
            sb.AppendLine("5. SENSÖR VERİLERİNE GÖRE EK UYARI (varsa)");

            return sb.ToString();
        }

        private static string GetCurrentSeason()
        {
            var month = DateTime.Now.Month;
            return month switch
            {   
                12 or 1 or 2 => "Kış",
                3 or 4 or 5 => "İlkbahar",
                6 or 7 or 8 => "Yaz",
                _ => "Sonbahar"
            };
        }

        public async Task<string> GetSensorAnalysisAsync(string sensorSummary, string? location)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("Sen uzman bir Ziraat Mühendisisin.");
                sb.AppendLine("Aşağıda bir narenciye bahçesinin yakın geçmişe ait ortalama/özet sensör verileri verilmiştir.");
                sb.AppendLine("Bu verilere bakarak bahçenin genel sağlığı, sulama ihtiyacı ve olası hastalık riskleri hakkında üreticiye tavsiyeler ver.");
                sb.AppendLine("Lütfen 3-4 paragrafı aşmayacak şekilde kısa, net ve anlaşılır bir Türkçe ile rapor sun.");
                sb.AppendLine();
                sb.AppendLine("SENSÖR VERİ ÖZETİ:");
                sb.AppendLine(sensorSummary);
                if (!string.IsNullOrEmpty(location))
                {
                    sb.AppendLine($"BAHÇE KONUMU: {location}");
                }
                sb.AppendLine($"MEVSİM: {GetCurrentSeason()}");

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                var requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = sb.ToString() } } } },
                    generationConfig = new { temperature = 0.5, maxOutputTokens = 2048 }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    var fallback = await TryGroqFallbackAsync(sb.ToString(), 0.5, 2048, nameof(GetSensorAnalysisAsync));
                    return fallback ?? "AI analiz servisi şu anda yoğun, daha sonra tekrar deneyin.";
                }

                using var doc = JsonDocument.Parse(responseJson);
                var text = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                return text ?? "Rapor üretilemedi.";
            }
            catch
            {
                // catch bloğunda prompt'u tekrar oluşturmamız gerekiyor
                try
                {
                    var sb2 = new StringBuilder();
                    sb2.AppendLine("Sen uzman bir Ziraat Mühendisisin.");
                    sb2.AppendLine("Aşağıda bir narenciye bahçesinin sensör verileri verilmiştir.");
                    sb2.AppendLine("Kısa, net tavsiyeler ver. Türkçe yaz.");
                    sb2.AppendLine(sensorSummary);
                    if (!string.IsNullOrEmpty(location)) sb2.AppendLine($"KONUM: {location}");

                    var fallback = await TryGroqFallbackAsync(sb2.ToString(), 0.5, 2048, nameof(GetSensorAnalysisAsync));
                    if (fallback != null) return fallback;
                }
                catch { /* Groq da başarısız, aşağıdaki statik mesaj dönecek */ }

                return "Yapay zeka servisi şu an yanıt vermiyor.";
            }
        }

        public async Task<(bool isLeaf, string message)> ValidateLeafImageAsync(byte[] imageBytes)
        {
            try
            {
                var base64Image = Convert.ToBase64String(imageBytes);

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new object[]
                            {
                                new
                                {
                                    text = "Bu görsele bak ve SADECE şu soruyu yanıtla: Bu görsel bir bitki yaprağı mı? " +
                                           "Yanıtını SADECE şu formatta ver, başka hiçbir şey yazma:\n" +
                                           "EVET - [kısa açıklama]\n" +
                                           "veya\n" +
                                           "HAYIR - [kısa açıklama]\n\n" +
                                           "Örnek doğru yanıtlar:\n" +
                                           "EVET - Narenciye yaprağı görülüyor\n" +
                                           "HAYIR - Bu bir ekran görüntüsü, yaprak değil"
                                },
                                new
                                {
                                    inline_data = new
                                    {
                                        mime_type = "image/jpeg",
                                        data = base64Image
                                    }
                                }
                            }
                        }
                    },
                    generationConfig = new
                    {
                        temperature = 0.1,
                        maxOutputTokens = 100
                    }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    // API hatası durumunda güvenli tarafta kal → geçir
                    return (true, "Görsel doğrulama servisi yanıt vermedi, tahmin devam ediyor.");
                }

                using var doc = JsonDocument.Parse(responseJson);
                var text = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString() ?? "";

                var trimmed = text.Trim().ToUpperInvariant();

                if (trimmed.StartsWith("EVET"))
                {
                    return (true, text.Trim());
                }
                else
                {
                    return (false, text.Trim());
                }
            }
            catch (Exception)
            {
                // Hata durumunda güvenli tarafta kal → geçir
                return (true, "Görsel doğrulama yapılamadı, tahmin devam ediyor.");
            }
        }

        public async Task<string> GetChatbotResponseAsync(string userMessage, string context)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("Sen bir narenciye ve zirai danışmanlık uzmanı yapay zeka asistanısın. Üreticinin sorduğu soruya, verilen bağlama (hastalık veya bahçe durumu) uygun, kısa ve yapıcı yanıtlar ver. Güvenli ve doğru bilgi ver. Yanıtlarında çok uzun paragraflardan kaçın.");
                sb.AppendLine();
                sb.AppendLine("BAĞLAM (Hastalık/Bahçe Bilgisi):");
                sb.AppendLine(context);
                sb.AppendLine();
                sb.AppendLine("ÜRETİCİNİN SORUSU VEYA TALEBİ:");
                sb.AppendLine(userMessage);

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                var requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = sb.ToString() } } } },
                    generationConfig = new { temperature = 0.6, maxOutputTokens = 1024 }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode) 
                {
                    // Gemini başarısız → Groq'a düş
                    var fallback = await TryGroqFallbackAsync(sb.ToString(), 0.6, 1024, nameof(GetChatbotResponseAsync));
                    return fallback ?? "Şu anda yapay zeka kotası doldu. Lütfen biraz sonra tekrar deneyin. (Sistem Yanıtı)";
                }

                using var doc = JsonDocument.Parse(responseJson);
                var text = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                return text ?? "Yanıt üretilemedi.";
            }
            catch
            {
                // Gemini tamamen erişilemez → Groq'a düş
                try
                {
                    var sb2 = new StringBuilder();
                    sb2.AppendLine("Sen bir narenciye danışmanlık uzmanısın. Kısa ve yapıcı yanıtlar ver. Türkçe yaz.");
                    sb2.AppendLine($"BAĞLAM: {context}");
                    sb2.AppendLine($"SORU: {userMessage}");

                    var fallback = await TryGroqFallbackAsync(sb2.ToString(), 0.6, 1024, nameof(GetChatbotResponseAsync));
                    if (fallback != null) return fallback;
                }
                catch { /* Groq da başarısız */ }

                return "Yapay zeka servisi ile iletişim kurulamadı. Lütfen semptomları yakından takip edin ve genel zirai takvime uyun. (Sistem Yanıtı)";
            }
        }
        public async Task<string> GetKdsDetailedAnalysisAsync(double mlScore, Models.SensorReading reading, string? location)
        {
            try
            {
                var sb = new StringBuilder();
                sb.AppendLine("Sen uzman bir Ziraat Mühendisi ve Karar Destek Sistemi asistanısın.");
                sb.AppendLine("Sana özel bir Makine Öğrenmesi (ML) modelinden gelen 'Risk Skoru' ve anlık sensör verileri verilecektir.");
                sb.AppendLine("Bu verilere dayanarak üreticiye profesyonel, bilimsel ve uygulanabilir bir tavsiye raporu hazırlamanı istiyorum.");
                sb.AppendLine();
                sb.AppendLine("VERİLER:");
                sb.AppendLine($"- ML MODEL RİSK SKORU: %{mlScore:F1}");
                sb.AppendLine($"- TOPRAK NEMİ: %{reading.SoilMoisture:F1}");
                sb.AppendLine($"- HAVA SICAKLIĞI: {reading.AirTemperature:F1}°C");
                sb.AppendLine($"- HAVA NEMİ: %{reading.AirHumidity:F1}");
                sb.AppendLine($"- IŞIK ŞİDDETİ: {reading.LightLevel} Lux");
                sb.AppendLine($"- MEVSİM: {GetCurrentSeason()}");
                if (!string.IsNullOrEmpty(location)) sb.AppendLine($"- KONUM: {location}");
                sb.AppendLine();
                sb.AppendLine("RAPOR KURALLARI:");
                sb.AppendLine("1. Risk skoru yüksekse (%70+) tonunu daha ciddi ve uyarıcı tut.");
                sb.AppendLine("2. Veriler arasındaki çelişkileri (örn: yüksek sıcaklık ama yüksek toprak nemi) tarımsal açıdan yorumla.");
                sb.AppendLine("3. Sadece sulama değil, gübreleme veya hastalık riski gibi yan konulara da değin.");
                sb.AppendLine("4. Yanıtı 3-4 paragrafta tut, Türkçe ve samimi bir dille yaz.");

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";
                var requestBody = new
                {
                    contents = new[] { new { parts = new[] { new { text = sb.ToString() } } } },
                    generationConfig = new { temperature = 0.7, maxOutputTokens = 1500 }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    var fallback = await TryGroqFallbackAsync(sb.ToString(), 0.7, 1500, nameof(GetKdsDetailedAnalysisAsync));
                    return fallback ?? "AI analiz servisi şu anda yoğun. ML skorumuz riskli görünüyor, lütfen bahçenizi kontrol edin.";
                }

                using var doc = JsonDocument.Parse(responseJson);
                var text = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

                return text ?? "Analiz raporu oluşturulamadı.";
            }
            catch
            {
                // Gemini tamamen erişilemez → Groq'a düş
                try
                {
                    var sb2 = new StringBuilder();
                    sb2.AppendLine("Sen uzman bir Ziraat Mühendisisin. Kısa analiz raporu hazırla. Türkçe yaz.");
                    sb2.AppendLine($"ML RİSK SKORU: %{mlScore:F1}");
                    sb2.AppendLine($"TOPRAK NEMİ: %{reading.SoilMoisture:F1}, SICAKLIK: {reading.AirTemperature:F1}°C");
                    sb2.AppendLine($"HAVA NEMİ: %{reading.AirHumidity:F1}, IŞIK: {reading.LightLevel} Lux");
                    if (!string.IsNullOrEmpty(location)) sb2.AppendLine($"KONUM: {location}");

                    var fallback = await TryGroqFallbackAsync(sb2.ToString(), 0.7, 1500, nameof(GetKdsDetailedAnalysisAsync));
                    if (fallback != null) return fallback;
                }
                catch { /* Groq da başarısız */ }

                return "Yapay zeka analizine şu an ulaşılamıyor. ML skoru üzerinden takibe devam edebilirsiniz.";
            }
        }

        /// <summary>
        /// Groq fallback'i dener. API key yoksa veya Groq da başarısızsa null döner.
        /// Null dönerse çağıran metot kendi statik mesajını kullanır.
        /// </summary>
        private async Task<string?> TryGroqFallbackAsync(
            string prompt, double temperature, int maxTokens, string methodName)
        {
            if (!_groq.IsConfigured) return null;

            try
            {
                _logger.LogWarning(
                    "[{Method}] Gemini başarısız — Groq fallback devreye giriyor...", methodName);

                var result = await _groq.GenerateTextAsync(prompt, temperature, maxTokens);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "[{Method}] Groq fallback da başarısız oldu.", methodName);
                return null;
            }
        }
    }
}