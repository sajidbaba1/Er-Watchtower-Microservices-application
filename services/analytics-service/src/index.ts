import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@clickhouse/client';
import { Kafka } from 'kafkajs';
import { register, Counter, Histogram } from 'prom-client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ClickHouse Setup
const chClient = createClient({
    host: process.env.CLICKHOUSE_HOST || 'http://localhost:8124',
    username: 'default',
    password: 'password',
    database: 'default'
});

// Kafka Setup (Consumer for Delivery Events)
const kafka = new Kafka({
    clientId: 'analytics-service',
    brokers: [process.env.KAFKA_HOST || 'localhost:9093']
});
const consumer = kafka.consumer({ groupId: 'analytics-group' });

// Metrics
const transitHistogram = new Histogram({
    name: 'shipment_transit_time_seconds',
    help: 'Transit time of shipments in seconds',
    labelNames: ['region']
});

// Initialize ClickHouse Table with retry logic
async function initDB(retries = 10, delay = 3000): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await chClient.query({
                query: `
                    CREATE TABLE IF NOT EXISTS shipment_events (
                        shipment_id String,
                        region String,
                        transit_time_seconds Float64,
                        event_time DateTime DEFAULT now()
                    ) ENGINE = MergeTree()
                    ORDER BY event_time
                `
            });
            console.log('[clickhouse]: Schema ready');
            return;
        } catch (err) {
            console.log(`[clickhouse]: Connection attempt ${i + 1}/${retries} failed, retrying in ${delay / 1000}s...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Kafka Consumer Logic
async function startConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'shipment-delivered', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ message }) => {
            if (!message.value) return;
            const event = JSON.parse(message.value.toString());

            // Log to ClickHouse for Big Data Analysis
            await chClient.insert({
                table: 'shipment_events',
                values: [{
                    shipment_id: event.id,
                    region: event.region,
                    transit_time_seconds: event.duration
                }],
                format: 'JSONEachRow'
            });

            transitHistogram.labels(event.region).observe(event.duration);
        }
    });
}

/**
 * Endpoints
 */

app.get('/api/analytics/transit-times', async (req, res) => {
    try {
        const resultSet = await chClient.query({
            query: `
                SELECT 
                    region, 
                    avg(transit_time_seconds) as avg_time,
                    count() as total_shipments
                FROM shipment_events
                GROUP BY region
                ORDER BY avg_time DESC
            `,
            format: 'JSONEachRow'
        });
        const dataset = await resultSet.json();
        res.json(dataset);
    } catch (err) {
        res.status(500).json({ error: 'Analytics query failed' });
    }
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Watchtower Analytics', engine: 'ClickHouse' });
});

const PORT = 4005; // Watchtower Analytics Port
app.listen(PORT, async () => {
    console.log(`[analytics-service]: Listening on http://localhost:${PORT}`);
    await initDB();
    startConsumer().catch(console.error);
});
