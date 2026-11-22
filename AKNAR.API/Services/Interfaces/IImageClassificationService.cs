using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface IImageClassificationService
    {
        Dictionary<string, double> TrainModel();

        ImagePrediction Predict(byte[] imageBytes);

        bool IsModelReady();


    }
}
