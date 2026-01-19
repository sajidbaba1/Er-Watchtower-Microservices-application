import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { register } from 'prom-client';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'watchtower-secret-key-2026';

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Simplified for MVP - in production use bcrypt + Postgres
    if (username === 'admin' && password === 'password') {
        const token = jwt.sign({ id: 1, role: 'GOV_AUDITOR' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, user: { name: 'Government Auditor', role: 'GOV_AUDITOR' } });
    }

    res.status(401).json({ error: 'Unauthorized Access' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Watchtower Auth', auth: 'JWT Secured' });
});

const PORT = 4004; // Watchtower Auth Port
app.listen(PORT, () => {
    console.log(`[auth-service]: Listening on http://localhost:${PORT}`);
});
