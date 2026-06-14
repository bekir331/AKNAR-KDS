using AKNAR.API.Models;
using AKNAR.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AKNAR.API.Hosted
{
    public class SensorSimulatorWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<SensorSimulatorWorker> _logger;

        public SensorSimulatorWorker(
            IServiceScopeFactory scopeFactory,
            IConfiguration config,
            ILogger<SensorSimulatorWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "SensorSimulatorWorker: IoT:Simulator:Enabled = {Enabled}",
                _config.GetValue<bool>("IoT:Simulator:Enabled"));

            while (!stoppingToken.IsCancellationRequested)
            {
                if (!_config.GetValue<bool>("IoT:Simulator:Enabled"))
                {
                    await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
                    continue;
                }

                var intervalSeconds = Math.Clamp(
                    _config.GetValue("IoT:Simulator:IntervalSeconds", 30),
                    5,
                    600);

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AknarKdsContext>();
                    var sensor = scope.ServiceProvider.GetRequiredService<ISensorReadingService>();

                    var deviceIds = await db.Devices
                        .Where(d => d.IsActive)
                        .Select(d => d.Id)
                        .ToListAsync(stoppingToken);

                    foreach (var deviceId in deviceIds)
                    {
                        var reading = new SensorReading
                        {
                            DeviceId = deviceId,
                            SoilMoisture = Math.Round(20 + Random.Shared.NextDouble() * 60, 1),
                            AirTemperature = Math.Round(15 + Random.Shared.NextDouble() * 20, 1),
                            AirHumidity = Math.Round(40 + Random.Shared.NextDouble() * 50, 1),
                            LightLevel = Math.Round(200 + Random.Shared.NextDouble() * 800, 0),
                            ReadAt = DateTime.Now
                        };
                        await sensor.AddReadingAsync(reading);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Sensor simülatör turunda hata.");
                }

                await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
            }
        }
    }
}
