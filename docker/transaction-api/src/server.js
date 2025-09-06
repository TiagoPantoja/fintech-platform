const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');
const winston = require('winston');
const axios = require('axios');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());

const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fintech',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 10
});

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => logger.error('Erro no Redis:', err));
redisClient.connect();

async function initDatabase() {
    try {
        await pgPool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        logger.info('Banco de dados inicializado');
    } catch (error) {
        logger.error('Falha na inicialização do banco:', error);
        process.exit(1);
    }
}

async function sendNotification(transaction) {
    try {
        const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:8081';
        await axios.post(`${notificationUrl}/notify`, {
            user_id: transaction.user_id,
            type: 'transaction_created',
            message: `Transação ${transaction.id} criada com sucesso`,
            transaction_id: transaction.id
        });
    } catch (error) {
        logger.error('Falha ao enviar notificação:', error);
    }
}

app.get('/health', async (req, res) => {
    try {
        await pgPool.query('SELECT 1');
        await redisClient.ping();

        res.json({
            status: 'saudavel',
            service: 'transaction-api',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ status: 'indisponivel', erro: error.message });
    }
});

app.post('/transactions', async (req, res) => {
    try {
        const { user_id, amount, type, description } = req.body;

        if (!user_id || !amount || !type) {
            return res.status(400).json({ erro: 'Campos estão faltando' });
        }

        if (amount <= 0) {
            return res.status(400).json({ erro: 'Valor deve ser positivo' });
        }

        const result = await pgPool.query(
            `INSERT INTO transactions (user_id, amount, type, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, amount, type, description]
        );

        const transaction = result.rows[0];

        await redisClient.del(`user_transactions:${user_id}`);

        setImmediate(() => sendNotification(transaction));

        logger.info(`Transação criada: ${transaction.id}`);
        res.status(201).json({ sucesso: true, dados: transaction });

    } catch (error) {
        logger.error('Erro ao criar transação:', error);
        res.status(500).json({ erro: 'Falha ao criar transação' });
    }
});

app.get('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `transaction:${id}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({
                sucesso: true,
                dados: JSON.parse(cached),
                cache: true
            });
        }

        const result = await pgPool.query(
            'SELECT * FROM transactions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Transação não encontrada' });
        }

        const transaction = result.rows[0];

        await redisClient.setEx(cacheKey, 300, JSON.stringify(transaction));

        res.json({ sucesso: true, dados: transaction, cache: false });

    } catch (error) {
        logger.error('Erro ao buscar transação:', error);
        res.status(500).json({ erro: 'Falha ao buscar transação' });
    }
});

app.get('/users/:userId/transactions', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, offset = 0 } = req.query;
        const cacheKey = `user_transactions:${userId}:${limit}:${offset}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({
                sucesso: true,
                dados: JSON.parse(cached),
                cache: true
            });
        }

        const result = await pgPool.query(
            `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const transactions = result.rows;

        await redisClient.setEx(cacheKey, 120, JSON.stringify(transactions));

        res.json({ sucesso: true, dados: transactions, cache: false });

    } catch (error) {
        logger.error('Erro ao buscar transações:', error);
        res.status(500).json({ erro: 'Falha ao buscar transações' });
    }
});

async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`API de Transações rodando na porta ${PORT}`);
        });
    } catch (error) {
        logger.error('Falha ao iniciar servidor:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    logger.info('Encerrando servidor');
    await pgPool.end();
    await redisClient.quit();
    process.exit(0);
});

startServer();

module.exports = app;