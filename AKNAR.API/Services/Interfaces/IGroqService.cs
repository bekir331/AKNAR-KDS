namespace AKNAR.API.Services.Interfaces
{
    
    public interface IGroqService
    {
      
        Task<string> GenerateTextAsync(string prompt, double temperature = 0.7, int maxTokens = 2048);

        
        bool IsConfigured { get; }
    }
}
