const axios = require('axios');

const endpoints = [
    { name: 'Auth Service', url: 'http://localhost:4004/health' },
    { name: 'Analytics Service', url: 'http://localhost:4005/health' },
    { name: 'Shipment Service', url: 'http://localhost:5001/health' },
    { name: 'Inventory Service', url: 'http://localhost:8081/health' },
    { name: 'Frontend', url: 'http://localhost:3011' },
    { name: 'MinIO Console', url: 'http://localhost:9021' },
    { name: 'ClickHouse', url: 'http://localhost:8124' }
];

async function verify() {
    console.log('🛡️ WATCHTOWER INTEGRITY SCAN');
    console.log('============================');

    for (const ep of endpoints) {
        try {
            await axios.get(ep.url, { timeout: 2000 });
            console.log(`✅ ${ep.name.padEnd(20)}: ONLINE`);
        } catch (err) {
            console.log(`❌ ${ep.name.padEnd(20)}: UNREACHABLE`);
        }
    }
    console.log('============================');
    console.log('Result: If all green, the Watchtower is fully operational.');
}

verify();
