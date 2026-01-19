package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/segmentio/kafka-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

var (
	eventsProcessed = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "inventory_rfid_events_total",
			Help: "Total number of RFID events processed by the worker group",
		},
	)
)

func init() {
	prometheus.MustRegister(eventsProcessed)
}

type RFIDEvent struct {
	TagID     string    `json:"tag_id"`
	Location  string    `json:"location"`
	Timestamp time.Time `json:"timestamp"`
}

func initTracer() (*sdktrace.TracerProvider, error) {
	ctx := context.Background()
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithInsecure(),
		otlptracegrpc.WithEndpoint("localhost:4319"), // Watchtower Jaeger
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("watchtower-inventory-service"),
		)),
	)
	otel.SetTracerProvider(tp)
	return tp, nil
}

func startKafkaWorker(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{"localhost:9093"}, // Watchtower Kafka
		Topic:    "rfid-pings",
		GroupID:  "inventory-workers",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	log.Println("[worker]: Connected to Kafka, waiting for RFID pings...")

	for {
		m, err := r.ReadMessage(ctx)
		if err != nil {
			break
		}

		// High-speed processing using a goroutine pool pattern (simplified here)
		go func(msg kafka.Message) {
			var event RFIDEvent
			if err := json.Unmarshal(msg.Value, &event); err != nil {
				return
			}
			
			// Simulate high-volume processing logic (e.g., updating Redis or ClickHouse)
			eventsProcessed.Inc()
			
			if eventsProcessed != nil { // Fake check to avoid unused
				// fmt.Printf("Processed tag: %s at %s\n", event.TagID, event.Location)
			}
		}(m)
	}

	if err := r.Close(); err != nil {
		log.Fatal("failed to close reader:", err)
	}
}

func main() {
	tp, err := initTracer()
	if err != nil {
		log.Fatal(err)
	}
	defer func() { _ = tp.Shutdown(context.Background()) }()

	r := gin.Default()

	// Monitoring
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "UP",
			"service": "Watchtower Inventory",
			"mode": "High-Throughput (Go Concurrency)",
		})
	})

	// Kafka Worker Execution
	wg := &sync.WaitGroup{}
	wg.Add(1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go startKafkaWorker(ctx, wg)

	log.Println("[inventory-service]: Serving API on http://localhost:8081")
	r.Run(":8081") // Watchtower Inventory Port
}
