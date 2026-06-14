using AKNAR.API.Models;

namespace AKNAR.API.Services.Interfaces
{
    public interface IImageClassificationService
    {
        void TrainModel();

        ImagePrediction Predict(byte[] imageBytes);

        bool IsModelReady();


    }
}
