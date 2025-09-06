const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

const app = express();
const PORT = process.env.PORT || 8081;

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

async function initDatabase() {
    try {
        await pgPool.query(`
      CREATE SCHEMA IF NOT EXISTS notifications;
      
      CREATE TABLE IF NOT EXISTS notifications.user_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        transaction_id UUID,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        logger.info('Banco de notificações inicializado');
    } catch (error) {
        logger.error('Falha na inicialização do banco:', error);
        process.exit(1);
    }
}

app.get('/health', async (req, res) => {
    try {
        await pgPool.query('SELECT 1');
        res.json({
            status: 'saudavel',
            service: 'notification-service',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ status: 'indisponivel', erro: error.message });
    }
});

app.post('/notify', async (req, res) => {
    try {
        const { user_id, type, message, transaction_id } = req.body;

        if (!user_id || !type || !message) {
            return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
        }

        const result = await pgPool.query(
            `INSERT INTO notifications.user_notifications (user_id, type, message, transaction_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, type, message, transaction_id]
        );

        const notification = result.rows[0];

        logger.info(`Notificação criada para usuário ${user_id}: ${type}`);
        res.status(201).json({ sucesso: true, dados: notification });

    } catch (error) {
        logger.error('Erro ao criar notificação:', error);
        res.status(500).json({ erro: 'Falha ao criar notificação' });
    }
});

app.get('/notifications/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { limit = 20, unread_only = false } = req.query;

        let query = `
      SELECT * FROM notifications.user_notifications 
      WHERE user_id = $1
    `;

        if (unread_only === 'true') {
            query += ' AND read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';

        const result = await pgPool.query(query, [user_id, limit]);

        res.json({
            sucesso: true,
            dados: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        logger.error('Erro ao buscar notificações:', error);
        res.status(500).json({ erro: 'Falha ao buscar notificações' });
    }
});

app.patch('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pgPool.query(
            `UPDATE notifications.user_notifications 
       SET read = TRUE 
       WHERE id = $1 
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Notificação não encontrada' });
        }

        res.json({ sucesso: true, dados: result.rows[0] });

    } catch (error) {
        logger.error('Erro ao atualizar notificação:', error);
        res.status(500).json({ erro: 'Falha ao atualizar notificação' });
    }
});

async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Serviço de Notificações rodando na porta ${PORT}`);
        });
    } catch (error) {
        logger.error('Falha ao iniciar servidor:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    logger.info('Encerrando servidor');
    await pgPool.end();
    process.exit(0);
});

startServer();

module.exports = app;