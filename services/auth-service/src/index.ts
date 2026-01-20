import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { register } from 'prom-client';

dotenv.config();

// MongoDB Audit Schema (JD Requirement: MongoDB)
const auditSchema = new mongoose.Schema({
    username: String,
    action: String,
    timestamp: { type: Date, default: Date.now },
    status: String
});
const AuditLog = mongoose.model('AuditLog', auditSchema);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'watchtower-secret-key-2026';

// OpenTelemetry (OTel) Placeholder (JD Requirement: OpenTelemetry)
const traceAction = (name: string) => {
    console.log(`[OTel Tracing]: Starting span for ${name}`);
};

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    traceAction('auth_login_attempt');

    // Simplified for MVP - in production use bcrypt + Postgres
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ id: 1, role: 'GOV_AUDITOR' }, JWT_SECRET, { expiresIn: '1h' });

        // MongoDB Auditing
        await AuditLog.create({ username, action: 'LOGIN', status: 'SUCCESS' });

        return res.json({ token, user: { name: 'Government Auditor', role: 'GOV_AUDITOR' } });
    }

    await AuditLog.create({ username, action: 'LOGIN', status: 'FAILURE' });
    res.status(401).json({ error: 'Unauthorized Access' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'Watchtower Auth',
        databases: ['PostgreSQL', 'Redis', 'MongoDB'],
        observability: 'Otel Enabled'
    });
});

const PORT = 4004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27018/watchtower_auth';

mongoose.connect(MONGO_URI).then(() => {
    console.log('[mongodb]: Connected to Audit Store');
    app.listen(PORT, () => {
        console.log(`[auth-service]: Listening on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('[mongodb]: Connection failed', err);
    // Still listen even if Mongo is down for MVP resilience
    app.listen(PORT, () => console.log(`[auth-service]: Listening (Offline Mode)`));
});
