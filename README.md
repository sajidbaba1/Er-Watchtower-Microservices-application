# Er-Watchtower Microservices Application 🛡️

A high-reliability microservices platform designed for mission-critical logistics tracking, global trade, and shipment monitoring.

## 🏗️ Architecture
This is a polyglot microservices ecosystem leveraging modern technologies for high performance and observability.

- **Frontend**: Next.js (Command Center)
- **Services**: 
  - **Auth Service**: Node.js/Express
  - **Shipment Service**: .NET 8 (with RSA-256 PDF Signing)
  - **Inventory Service**: Go (RFID Throughput & Kafka)
  - **Analytics Service**: Node.js (ClickHouse aggregation)
- **Infrastructure**: Docker Compose, PostgreSQL, Redis, Kafka, MinIO, ClickHouse
- **Observability**: Prometheus, Grafana, Jaeger

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- .NET 8 SDK
- Go 1.21+

### 1. Infrastructure Setup
Spin up the core services:
```bash
docker-compose up -d
```

### 2. Service Endpoints
- **Auth**: `http://localhost:4004`
- **Shipment**: `http://localhost:5001`
- **Inventory**: `http://localhost:8081`
- **Analytics**: `http://localhost:4005`
- **Command Center**: `http://localhost:3011`

## 🛠️ Key Features
1. **Cryptographic Manifests**: Automatically generates and signs shipment PDFs using RSA-256.
2. **Real-time Tracking**: High-speed Kafka-based event processing for RFID and logistics.
3. **Data Intelligence**: Advanced transit data aggregation using ClickHouse.
4. **Full Observability**: Integrated health monitoring and distributed tracing across all services.

## 👥 Authors
- **Sajid Shaikh** (ss2727303@gmail.com)
