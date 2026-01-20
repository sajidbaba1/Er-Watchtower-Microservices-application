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
Spin up the core services (including MongoDB and Jaeger):
```bash
docker-compose up -d
```

---

## 🏗️ Technical Architecture & JD Alignment

This project is meticulously architected to meet **Eurusys Enterprise Standards (30-40 LPA Bracket)**:

### **1. Polyglot Microservices (0 → 1 MVP)**
- **Shipment Service (.NET 8/C#)**: Handles heavy cryptographic binary operations (RSA-256 PDF signing). Uses **Dependency Injection** and clean architecture.
- **Inventory Service (GoLang)**: Optimized for high-throughput Kafka ingestion using goroutines (Simulating 100k+ RFID pings).
- **Auth & Analytics (Node.js/TypeScript)**: Leverages Express for I/O-bound REST APIs.

### **2. Multi-Database Strategy**
- **PostgreSQL**: Transactional integrity for user data.
- **Redis**: Low-latency caching for session management.
- **ClickHouse**: Columnar storage for Big Data analytics (Regional transit aggregations).
- **MongoDB**: Schema-less auditing for security tracking and login history.

### **3. Observability & Security (Mission-Critical)**
- **OpenTelemetry (OTel)**: Distributed tracing integrated with **Jaeger** for bottleneck identification.
- **Prometheus & Grafana**: Real-time infrastructure monitoring.
- **Cryptographic Security**: RSA-256 signatures for shipment manifests, ensuring government-grade data integrity.

### **4. DevOps & QA**
- **GitHub Actions**: Automated CI/CD pipeline for building and testing all polyglot services.
- **Environment Validation**: Custom integration test scripts (`/tests/validate_env.sh`) for automated health checks.
- **Unit Testing**: Included for Go and .NET services to ensure reliability.

## 📡 Service Endpoints
- **Auth (Node/TS/Mongo)**: `http://localhost:4004`
- **Shipment (.NET/S3)**: `http://localhost:5001`
- **Inventory (Go/Kafka)**: `http://localhost:8081`
- **Analytics (ClickHouse)**: `http://localhost:4005`
- **Command Center (Next.js)**: `http://localhost:3011`
- **Tracing (Jaeger)**: `http://localhost:16686`

## 👥 Authors
- **Sajid Alimahamad Shaikh** (ss2727303@gmail.com)
  *B.E. Computer Engineering*
