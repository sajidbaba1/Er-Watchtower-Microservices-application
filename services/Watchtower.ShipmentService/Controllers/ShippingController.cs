using Amazon.S3;
using Amazon.S3.Model;
using Confluent.Kafka;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Watchtower.ShipmentService.Controllers {
    [ApiController] [Route("api/[controller]")]
    public class ShippingController : ControllerBase {
        private readonly IAmazonS3 _s3;
        private readonly string _kafka;
        public ShippingController(IAmazonS3 s3, IConfiguration cfg) {
            _s3 = s3;
            _kafka = cfg["KAFKA_BOOTSTRAP"] ?? "kafka:9092";
        }
        [HttpPost("generate")]
        public async Task<IActionResult> Create([FromBody] ShipmentRequest req) {
            var id = Guid.NewGuid().ToString();
            var pdf = Document.Create(c => {
                c.Page(p => {
                    p.Size(PageSizes.A4);
                    p.Header().Text("WATCHTOWER MANIFEST").FontSize(20).Bold();
                    p.Content().Text($"Manifest ID: {id}\nTo: {req.RecipientName}\nDest: {req.Destination}");
                });
            }).GeneratePdf();
            await _s3.PutObjectAsync(new PutObjectRequest {
                BucketName = "manifest-vault", Key = $"{id}.pdf", InputStream = new MemoryStream(pdf)
            });
            using var p = new ProducerBuilder<Null, string>(new ProducerConfig { BootstrapServers = _kafka }).Build();
            await p.ProduceAsync("shipment-delivered", new Message<Null, string> { 
                Value = JsonConvert.SerializeObject(new { id, region = req.Destination, duration = 100 }) 
            });
            return Ok(new { Success = true, ManifestId = id });
        }
    }
    public class ShipmentRequest { 
        public string RecipientName { get; set; } = ""; 
        public string Destination { get; set; } = ""; 
    }
}
