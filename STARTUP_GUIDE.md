# Watchtower: Startup Guide 🛡️

## 🚀 Welcome to the Global Trade & Shipment Watchtower

This project is a high-reliability microservices platform designed for mission-critical logistics tracking.

### 🛠️ Prerequisites
- **Docker & Docker Compose**
- **Node.js 18+**
- **.NET 8 SDK**
- **Go 1.21+**

---

### 1. Start the Infrastructure (Big 5 Services)
Run this from the project root:
```bash
docker-compose up -d
```
Verified ports:
- **PostgreSQL**: 5434
- **Redis**: 6380
- **Kafka**: 9093
- **MinIO**: 9021 (Console)
- **ClickHouse**: 8124
- **Grafana**: 3010

---

### 2. Run the Microservices

#### **A. Auth Service (Node.js)**
```bash
cd services/auth-service
npm run dev
```
Port: `http://localhost:4004`

#### **B. Shipment Service (.NET 8)**
```bash
cd services/Watchtower.ShipmentService
dotnet run
```
Port: `http://localhost:5001`

#### **C. Inventory Service (Go)**
```bash
cd services/inventory-service
go run main.go
```
Port: `http://localhost:8081`

#### **D. Analytics Service (Node.js)**
```bash
cd services/analytics-service
npm run dev
```
Port: `http://localhost:4005`

---

### 3. Run the Command Center (Next.js)
```bash
cd client
npm run dev
```
Access at: `http://localhost:3011`

---

### 🧪 Features to Demo
1. **Manifest Signing**: Use the Dashboard or Swagger (`http://localhost:5001/swagger`) to create a shipment. It will generate a PDF, sign it cryptographically, and store it in MinIO.
2. **RFID Throughput**: The Go service is listening on Kafka for events. Even without events, the Dashboard simulates the high-speed heartbeat of the system.
3. **Data Intelligence**: Check the Analytics tab to see how ClickHouse aggregates transit data across regions.

---

### 📜 Digital Integrity & Security
- **Manifests**: Every PDF is signed using RSA-256.
- **Audit**: All events are persisted in ClickHouse for government-grade audit trails.
- **Monitoring**: Full Prometheus & Jaeger integration across all polyglot services.
