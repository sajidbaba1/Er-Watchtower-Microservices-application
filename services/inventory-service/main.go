package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/segmentio/kafka-go"
)

var (
	eventsProcessed = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "inventory_rfid_events_total",
			Help: "Total number of RFID events processed",
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

func startKafkaWorker(ctx context.Context, wg *sync.WaitGroup) {
	defer wg.Done()
	kafkaHost := os.Getenv("KAFKA_HOST")
	if kafkaHost == "" {
		kafkaHost = "kafka:9092"
	}

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{kafkaHost},
		Topic:    "rfid-pings",
		GroupID:  "inventory-workers",
		MinBytes: 10e3,
		MaxBytes: 10e6,
	})

	log.Println("[worker]: Connected to Kafka: ", kafkaHost)

	for {
		m, err := r.ReadMessage(ctx)
		if err != nil {
			log.Println("[worker] Error reading message:", err)
			break
		}

		go func(msg kafka.Message) {
			var event RFIDEvent
			if err := json.Unmarshal(msg.Value, &event); err != nil {
				return
			}
			eventsProcessed.Inc()
		}(m)
	}
	r.Close()
}

func main() {
	r := gin.Default()

	// Simple CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "service": "Watchtower Inventory"})
	})

	wg := &sync.WaitGroup{}
	wg.Add(1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go startKafkaWorker(ctx, wg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Println("[inventory] Serving on Port:", port)
	r.Run(":" + port)
}
