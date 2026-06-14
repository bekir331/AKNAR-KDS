using AKNAR.API.Services.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
// ↑ Groq API, OpenAI uyumlu bir REST API kullanır.
//   Bu yüzden istek formatı ChatGPT ile aynıdır:
//   POST https://api.groq.com/openai/v1/chat/completions

namespace AKNAR.API.Services
{
    public class GroqService : IGroqService
    {
        private readonly HttpClient _httpClient;
        // ↑ Groq API'ye HTTP istekleri göndermek için.

        private readonly string? _apiKey;
        // ↑ Groq API key. null ise fallback devre dışıdır.

        private readonly string _model;
        // ↑ Kullanılacak Llama modeli.
        //   "llama-3.3-70b-versatile" = en güçlü ücretsiz metin modeli
        //   "llama-3.1-8b-instant"    = çok hızlı ama daha küçük

        private readonly ILogger<GroqService> _logger;

        private const string GroqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
        // ↑ Groq'un OpenAI uyumlu endpoint'i.

        public bool IsConfigured => !string.IsNullOrEmpty(_apiKey);
        // ↑ API key ayarlanmışsa true döner.
        //   GeminiService bunu kontrol edip fallback'i kullanır veya atlar.

        public GroqService(IConfiguration config, ILogger<GroqService> logger)
        {
            _httpClient = new HttpClient();
            _logger = logger;

            // appsettings.json veya User Secrets'tan oku
            _apiKey = config["Groq:ApiKey"];
            _model = config["Groq:Model"] ?? "llama-3.3-70b-versatile";

            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning(
                    "Groq:ApiKey yapılandırılmamış. Groq fallback devre dışı. " +
                    "Etkinleştirmek için: dotnet user-secrets set \"Groq:ApiKey\" \"<KEY>\"");
            }
            else
            {
                _logger.LogInformation("Groq fallback motoru aktif. Model: {Model}", _model);
            }
        }

        public async Task<string> GenerateTextAsync(
            string prompt,
            double temperature = 0.7,
            int maxTokens = 2048)
        {
            // API key yoksa hemen hata fırlat,
            // GeminiService kendi fallback mesajını döndürsün.
            if (!IsConfigured)
                throw new InvalidOperationException("Groq API key yapılandırılmamış.");

            // ── OpenAI uyumlu request body ──
            // Groq, OpenAI'ın chat/completions formatını birebir destekler.
            // "messages" dizisi içinde "system" ve "user" rolleri kullanılır.
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                },
                temperature,
                max_tokens = maxTokens
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var request = new HttpRequestMessage(HttpMethod.Post, GroqApiUrl)
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };

            // ── Kimlik doğrulama ──
            // Groq, Bearer token kullanır (Gemini'den farklı olarak key query param değil).
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.SendAsync(request);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Groq API hata döndürdü. Status: {Status}, Body: {Body}",
                    (int)response.StatusCode, responseJson);
                throw new HttpRequestException($"Groq API hatası: {(int)response.StatusCode}");
            }

            // ── Yanıt parse ──
            // OpenAI formatı: { choices: [ { message: { content: "..." } } ] }
            using var doc = JsonDocument.Parse(responseJson);
            var text = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            _logger.LogInformation("Groq fallback başarıyla yanıt üretti.");
            return text ?? "Yanıt üretilemedi.";
        }
    }
}
