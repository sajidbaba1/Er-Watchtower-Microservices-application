using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Confluent.Kafka;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Security.Cryptography;
using System.Text;

namespace Watchtower.ShipmentService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingController : ControllerBase
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName = "manifest-vault";
        private readonly string _kafkaBootstrap;
        private readonly string _topic = "shipment-delivered"; // Simplified: treating creation as start of transit

        public ShippingController(IAmazonS3 s3Client, IConfiguration config)
        {
            _s3Client = s3Client;
            _kafkaBootstrap = config["KAFKA_BOOTSTRAP"] ?? "localhost:9093";
        }

        [HttpPost("generate")]
        public async Task<IActionResult> CreateManifest([FromBody] ShipmentRequest request)
        {
            var manifestId = Guid.NewGuid().ToString();
            
            try 
            {
                // 1. Generate PDF Manifest
                byte[] pdfBytes = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Header().Text("EURUSYS WATCHTOWER - OFFICIAL MANIFEST").FontSize(20).Bold().FontColor(Colors.Blue.Medium);
                        page.Content().Column(col => {
                            col.Item().Text($"Manifest ID: {manifestId}");
                            col.Item().Text($"Shipment To: {request.RecipientName}");
                            col.Item().Text($"Origin: {request.Origin}");
                            col.Item().Text($"Destination: {request.Destination}");
                            col.Item().PaddingTop(10).Text("Items List:").Bold();
                            foreach(var item in request.Items) {
                                col.Item().Text($"- {item}");
                            }
                        });
                        page.Footer().AlignCenter().Text(x => {
                            x.Span("Page ");
                            x.CurrentPageNumber();
                        });
                    });
                }).GeneratePdf();

                // 2. Cryptographic Signing
                string dataToSign = $"{manifestId}|{request.RecipientName}|{request.Destination}";
                string signature = SignData(dataToSign);

                // 3. Upload to MinIO Vault
                if (!await AmazonS3Util.DoesS3BucketExistV2Async(_s3Client, _bucketName))
                {
                    await _s3Client.PutBucketAsync(_bucketName);
                }

                using (var stream = new MemoryStream(pdfBytes))
                {
                    var putRequest = new PutObjectRequest
                    {
                        BucketName = _bucketName,
                        Key = $"{manifestId}.pdf",
                        InputStream = stream,
                        Metadata = {
                            ["x-amz-meta-signature"] = signature,
                            ["x-amz-meta-manifest-id"] = manifestId
                        }
                    };
                    await _s3Client.PutObjectAsync(putRequest);
                }

                // 4. Emit Kafka Event for Analytics
                var kafkaConfig = new ProducerConfig { BootstrapServers = _kafkaBootstrap };
                using (var producer = new ProducerBuilder<Null, string>(kafkaConfig).Build())
                {
                    var msg = new { 
                        id = manifestId, 
                        region = request.Destination, 
                        duration = new Random().Next(20, 300) // Simulated baseline duration
                    };
                    await producer.ProduceAsync(_topic, new Message<Null, string> { Value = JsonConvert.SerializeObject(msg) });
                }

                return Ok(new {
                    Success = true,
                    ManifestId = manifestId,
                    Signature = signature,
                    Status = "Signed, Secured & Tracked",
                    Storage = "MinIO Vault",
                    Analytics = "Kafka Event Synchronized"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Failed to process manifest", Details = ex.Message });
            }
        }

        private string SignData(string data)
        {
            using var rsa = RSA.Create();
            byte[] dataBytes = Encoding.UTF8.GetBytes(data);
            byte[] signatureBytes = rsa.SignData(dataBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
            return Convert.ToBase64String(signatureBytes);
        }
    }

    public class ShipmentRequest
    {
        public string RecipientName { get; set; } = string.Empty;
        public string Origin { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public List<string> Items { get; set; } = new();
    }
}
