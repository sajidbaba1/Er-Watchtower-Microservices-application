using Amazon.S3;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;
using QuestPDF.Infrastructure;

// Setup QuestPDF License (Community)
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// --- OpenTelemetry Setup ---
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
        tracerProviderBuilder
            .AddSource("Watchtower.ShipmentService")
            .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("Watchtower.ShipmentService"))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddOtlpExporter(opt => {
                opt.Endpoint = new Uri("http://localhost:4319"); // Watchtower Jaeger OTLP
            }))
    .WithMetrics(metricsProviderBuilder =>
        metricsProviderBuilder
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddPrometheusExporter());

// --- S3 (MinIO) Client ---
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var config = new AmazonS3Config
    {
        ServiceURL = "http://localhost:9020", // Watchtower MinIO
        ForcePathStyle = true
    };
    return new AmazonS3Client("admin", "password", config);
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- Metrics Middleware ---
app.UseMetricServer(); // Exposes /metrics
app.UseHttpMetrics();

app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => new { status = "UP", service = "Watchtower.ShipmentService", platform = "Eurusys Watchtower" });

app.Run("http://localhost:5001");
