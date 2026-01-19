import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'rfid-simulator',
    brokers: ['localhost:9093']
});

const producer = kafka.producer();

const locations = ['Dubai-Hub', 'Abu-Dhabi-Port', 'Sharjah-Warehouse', 'London-Gateway', 'Singapore-Terminal'];
const tagPrefixes = ['TAG-X', 'RFID-Y', 'GOV-SAFE'];

async function runSimulator() {
    await producer.connect();
    console.log('🚀 RFID Simulator Started. Flooding Watchtower Kafka...');

    setInterval(async () => {
        const events = [];
        // Generate a batch of events
        for (let i = 0; i < 50; i++) {
            events.push({
                value: JSON.stringify({
                    tag_id: `${tagPrefixes[Math.floor(Math.random() * tagPrefixes.length)]}-${Math.floor(Math.random() * 10000)}`,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    timestamp: new Date().toISOString()
                })
            });
        }

        try {
            await producer.send({
                topic: 'rfid-pings',
                messages: events
            });
            process.stdout.write('.');
        } catch (err) {
            console.error('\n❌ Kafka Ingestion Failed:', err.message);
        }
    }, 500); // Send 100 events every second (batch of 50 every 500ms)
}

runSimulator().catch(console.error);
