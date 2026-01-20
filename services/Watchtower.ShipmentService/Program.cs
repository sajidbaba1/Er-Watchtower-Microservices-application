using Amazon.S3;
using Prometheus;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllers();
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
builder.Services.AddSingleton<IAmazonS3>(sp => {
    var config = new AmazonS3Config {
        ServiceURL = builder.Configuration["S3_URL"] ?? "http://minio:9000",
        ForcePathStyle = true
    };
    return new AmazonS3Client("admin", "password", config); // Hardcoded for infra match
});

var app = builder.Build();
app.UseRouting();
app.UseCors("AllowAll");
app.UseHttpMetrics();
app.MapControllers();
app.MapMetrics();
app.Run();
