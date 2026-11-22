using AKNAR.API.Hosted;

using AKNAR.API.Middleware;

using AKNAR.API.Models;

using AKNAR.API.Services;

using AKNAR.API.Services.Interfaces;

using BCrypt.Net;

using Microsoft.AspNetCore.Authentication.JwtBearer;

using Microsoft.EntityFrameworkCore;

using Microsoft.IdentityModel.Tokens;

using System.Text;





var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>

{

    options.AddPolicy("FrontendPolicy", policy =>

    {

        policy.WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:4173",
                    "http://localhost:8081",   // Expo web
                    "http://localhost:19006"   // Expo web (eski sürüm)
                )

               .AllowAnyHeader().AllowAnyMethod();

    });

});







builder.Services.AddDbContext<AknarKdsContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ISensorReadingService, SensorReadingService>();

builder.Services.AddScoped<IOrchardService, OrchardService>();

builder.Services.AddScoped<IAlertService, AlertService>();

builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IDeviceService, DeviceService>();

builder.Services.AddScoped<IIrrigationLogService, IrrigationLogService>();

builder.Services.AddScoped<IProducerService, ProducerService>();

builder.Services.AddScoped<IOwnershipService, OwnershipService>();
builder.Services.AddScoped<ISensorMlService, SensorMlService>();

builder.Services.AddSingleton<IImageClassificationService, ImageClassificationService>();

builder.Services.AddSingleton<IGroqService, GroqService>();
// ↑ Groq (Llama 3) yedek motor — Gemini 429 verdiğinde otomatik devreye girer.

builder.Services.AddSingleton<IGeminiService, GeminiService>();



if (builder.Configuration.GetValue<bool>("IoT:Simulator:Enabled"))

{

    builder.Services.AddHostedService<SensorSimulatorWorker>();

}



var jwtKey = builder.Configuration["Jwt:Key"];

var jwtIssuer = builder.Configuration["Jwt:Issuer"];

var jwtAudience = builder.Configuration["Jwt:Audience"];



builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)

    .AddJwtBearer(options =>

    {

        options.TokenValidationParameters = new TokenValidationParameters

        {

            ValidateIssuer = true,

           



            ValidateAudience = true,

            ValidateLifetime = true,



            ValidateIssuerSigningKey = true,

         



            ValidIssuer = jwtIssuer,

            ValidAudience = jwtAudience,

            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))

           

        };

    });



builder.Services.AddControllers()

    .AddJsonOptions(options =>

    {

        options.JsonSerializerOptions.ReferenceHandler =

            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;

    });



builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddProblemDetails();



builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>

{

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme

    {

        Name = "Authorization",

        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,

        Scheme = "Bearer",

        BearerFormat = "JWT",

        In = Microsoft.OpenApi.Models.ParameterLocation.Header,

        Description = "Token'� �u formatta gir: Bearer {token}"

       

    });



    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement

    {

        {

            new Microsoft.OpenApi.Models.OpenApiSecurityScheme

            {

                Reference = new Microsoft.OpenApi.Models.OpenApiReference

                {

                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,

                    Id   = "Bearer"

                }

            },

            new string[] {}

        }

    });

});



var app = builder.Build();



app.UseExceptionHandler();



if (app.Environment.IsDevelopment())

{

    app.UseSwagger();

    app.UseSwaggerUI();

}



// app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");



var leavesUploadPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "leaves");

Directory.CreateDirectory(leavesUploadPath);



app.UseStaticFiles();



app.UseAuthentication();





app.UseAuthorization();





app.MapControllers();

using (var scope = app.Services.CreateScope())

{

    var context = scope.ServiceProvider.GetRequiredService<AknarKdsContext>();



    if (!context.Users.Any())

   

    {

        var adminUser = new User

        {

            FullName = "Admin Kullan�c�",

            Email = "admin@aknar.com",

            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),

            

            Role = "Admin",

            CreatedAt = DateTime.Now

        };



        context.Users.Add(adminUser);

        context.SaveChanges();

    }

    if (!context.Producers.Any())

    {

        var adminUser = context.Users.First(u => u.Email == "admin@aknar.com");

        var producer = new Producer

        {

            UserId = adminUser.Id,

            Phone = "05551234567",

            City = "Gaziantep",

            Address = "Merkez"

        };

        context.Producers.Add(producer);

        context.SaveChanges();

    }

    if (!context.DiseaseRecommendations.Any())

    {

        var recommendations = new List<DiseaseRecommendation>

    {

        new DiseaseRecommendation

        {

            DiseaseName = "Anthracnose",

            Description = "Colletotrichum mantar�n�n neden oldu�u mantarsal bir hastal�k. Yaprak ve meyvelerde koyu kahverengi ��k�k lekeler olu�turur.",

            Treatment = "Bak�r bazl� fungisit (Bordo bulamac�) uygulay�n. Enfekte dallar� buday�p uzakla�t�r�n. �la�lamay� 10-14 g�n arayla 3 kez tekrarlay�n.",

            Prevention = "Bah�ede havaland�rmay� art�r�n. Sulama s�ras�nda yapraklar� �slatmay�n. D��en yaprak ve meyveleri temizleyin.",

            RiskLevel = "High",

            SeasonWarning = "Il�k ve nemli d�nemlerde (ilkbahar-yaz) risk artar."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Bacterial Blight",

            Description = "Bakteriyel yan�kl�k. Yapraklarda su emilmi� g�r�n�mde lekeler, dalda kuruma ve kabuk �atlamas� g�r�l�r.",

            Treatment = "Bak�r oksiklor�r uygulay�n. Enfekte dallar� sa�lam dokudan 15cm a�a��s�ndan kesin ve yak�n. Budama aletlerini %10 �ama��r suyu ile dezenfekte edin.",

            Prevention = "Sertifikal� fidan kullan�n. A��r� azotlu g�brelemeden ka��n�n. R�zgarl� havalarda budama yapmay�n.",

            RiskLevel = "High",

            SeasonWarning = "Ya���l� ilkbahar d�neminde h�zla yay�l�r."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Citrus Canker",

            Description = "Xanthomonas citri bakterisinin neden oldu�u ciddi bir hastal�k. Yaprak, meyve ve dallarda kabar�k, kratere benzer lekeler olu�turur.",

            Treatment = "Streptomisin s�lfat veya bak�r preparatlar� uygulay�n. A��r enfekte a�a�lar� s�k�p yak�n. B�lgeyi karantinaya al�n.",

            Prevention = "Fidan al�m�nda sa�l�k sertifikas� isteyin. R�zgar perdesi olu�turun. Bah�e aletlerini dezenfekte edin.",

            RiskLevel = "Critical",

            SeasonWarning = "S�cak ve ya���l� d�nemlerde en bula��c� seviyeye ula��r."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Curl Virus",

            Description = "Yaprak k�v�rc�kl�k vir�s�. Beyazsinek veya yaprak biti taraf�ndan ta��n�r. Yapraklar k�vr�l�r, b�z���r ve sarar�r.",

            Treatment = "Vir�s�n do�rudan tedavisi yoktur. Ta��y�c� b�cekleri kontrol alt�na al�n: Imidacloprid veya Acetamiprid uygulay�n. A��r enfekte dallar� kesin.",

            Prevention = "Sar� yap��kan tuzaklar kurun. Neem ya�� ile d�zenli koruyucu ila�lama yap�n. Dayan�kl� �e�it tercih edin.",

            RiskLevel = "High",

            SeasonWarning = "�lkbahar ve sonbaharda b�cek pop�lasyonu art�nca risk y�kselir."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Deficiency Leaf",

            Description = "Besin elementi eksikli�i. Yapraklarda sararma, damarlar aras� solma veya nekrotik lekeler g�r�l�r. Demir, �inko veya magnezyum eksikli�i yayg�nd�r.",

            Treatment = "Yaprak g�bresi uygulay�n (demir kelat, �inko s�lfat). Toprak analizi yapt�r�n. Eksik elemana g�re hedefli g�breleme yap�n.",

            Prevention = "D�zenli toprak analizi yapt�r�n. Dengeli NPK + mikro element g�bresi kullan�n. Toprak pH'�n� 6.0-7.0 aras�nda tutun.",

            RiskLevel = "Medium",

            SeasonWarning = "Vejetasyon d�nemi ba��nda (ilkbahar) eksiklik belirtileri belirginle�ir."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Dry Leaf",

            Description = "Yaprak kurumas�. Su stresi, a��r� s�cak veya k�k hasar� nedeniyle yapraklar u�lar�ndan kurumaya ba�lar.",

            Treatment = "Sulama program�n� kontrol edin. Damla sulama ile k�k b�lgesine yeterli su verin. K�k hasar� varsa k�k mantar� kontrol� yap�n.",

            Prevention = "D�zenli sulama takvimi olu�turun. Mal�lama ile toprak nemini koruyun. A��r� s�cakta g�lgeleme yap�n.",

            RiskLevel = "Medium",

            SeasonWarning = "Yaz aylar�nda s�cakl�k 40�C �zerine ��kt���nda risk artar."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Healthy Leaf",

            Description = "Yaprak sa�l�kl�. Herhangi bir hastal�k veya eksiklik belirtisi tespit edilmedi.",

            Treatment = "Tedavi gerekmez. Mevcut bak�m program�na devam edin.",

            Prevention = "D�zenli g�breleme, sulama ve ila�lama takvimini s�rd�r�n. Periyodik yaprak analizi yapt�r�n.",

            RiskLevel = "Low",

            SeasonWarning = null

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Sooty Mould",

            Description = "Fumajin (is k�f�). Yaprak y�zeyinde siyah kurum tabakas� olu�ur. Asl�nda b�ceklerin (unlu bit, yaprak biti) salg�lad��� bal �z� �zerinde geli�en mantard�r.",

            Treatment = "�nce b�cek kontrol� yap�n (unlu bit, yaprak biti, ko�nil). Sabunlu su ile yapraklar� y�kay�n. B�cek kontrol� sa�lan�nca k�f kendili�inden kaybolur.",

            Prevention = "Yaprak biti ve unlu bit pop�lasyonunu d���k tutun. Do�al d��manlar� (u�ur b�ce�i) koruyun. A��r� azotlu g�brelemeden ka��n�n.",

            RiskLevel = "Medium",

            SeasonWarning = "S�cak ve nemli d�nemlerde b�cek aktivitesi artar, k�f riski y�kselir."

        },

        new DiseaseRecommendation

        {

            DiseaseName = "Spider Mites",

            Description = "K�rm�z� �r�mcek (akar). Yaprak alt�nda ince a� �rer. Yapraklarda bronzla�ma, sararma ve d�k�lme g�r�l�r. ��plak g�zle zor g�r�l�r.",

            Treatment = "Akarisit (Abamectin, Spiromesifen) uygulay�n. Yaprak alt�na da ila� ula�t���ndan emin olun. 7 g�n arayla 2-3 kez tekrarlay�n.",

            Prevention = "Bah�ede toz olu�umunu �nleyin (yol kenar� tozlanma riski). A��r� s�cak d�nemlerde �stten sulama ile nem art�r�n. Do�al d��manlar� (avc� akarlar) koruyun.",

            RiskLevel = "High",

            SeasonWarning = "S�cak ve kurak yaz aylar�nda pop�lasyon patlamas� yapar."

        }

    };

        context.DiseaseRecommendations.AddRange(recommendations);

        context.SaveChanges();

    }



}

    app.Run();