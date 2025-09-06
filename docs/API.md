# Documentação APIs

## Transaction API (Porta 8080)

### Health Check

**Endpoint** GET `/health`

Resposta:
```json
{
  "status": "saudavel",
  "service": "transaction-api",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Criar Transação

**Endpoint** POST `/transactions`
Content-Type: application/json

Body:

```json
{
  "user_id": "user123",
  "amount": 100.50,
  "type": "credit",
  "description": "Depósito"
}
```

Resposta:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid-da-transacao",
    "user_id": "user123",
    "amount": "100.50",
    "type": "credit",
    "status": "completed",
    "description": "Depósito",
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
````


### Buscar Transação

**Endpoint** GET `/transactions/:id`

Resposta:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid-da-transacao",
    "user_id": "user123",
    "amount": "100.50",
    "type": "credit",
    "status": "completed",
    "description": "Depósito",
    "created_at": "2024-01-01T10:00:00.000Z"
  },
  "cache": false
}
```

### Buscar Transações do Usuário

**Endpoint** GET `/users/:userId/transactions?limit=10&offset=0`

Resposta:
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "uuid-da-transacao",
      "user_id": "user123",
      "amount": "100.50",
      "type": "credit",
      "status": "completed",
      "description": "Depósito",
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "cache": false
}
```

## Notification API (Porta 8081)

### Health Check
**Endpoint** GET `/health`

Resposta:
```json
{
  "status": "saudavel",
  "service": "notification-service",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Enviar Notificação (Webhook)
**Endpoint** POST `/notify`
Content-Type: application/json

Body:
```json
{
  "user_id": "user123",
  "type": "transaction_created",
  "message": "Transação criada com sucesso",
  "transaction_id": "uuid-da-transacao"
}
```

Resposta:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid-da-notificacao",
    "user_id": "user123",
    "type": "transaction_created",
    "message": "Transação criada com sucesso",
    "transaction_id": "uuid-da-transacao",
    "read": false,
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

### Buscar Notificações do Usuário
**Endpoint** GET `/notifications/:user_id?limit=20&unread_only=false`

Resposta:
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "uuid-da-notificacao",
      "user_id": "user123",
      "type": "transaction_created",
      "message": "Transação criada com sucesso",
      "transaction_id": "uuid-da-transacao",
      "read": false,
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

## Marcar Notificação como Lida
**Endpoint** PATCH `/notifications/:id/read`

Resposta:
```json
{
  "sucesso": true,
  "dados": {
    "id": "uuid-da-notificacao",
    "user_id": "user123",
    "type": "transaction_created",
    "message": "Transação criada com sucesso",
    "transaction_id": "uuid-da-transacao",
    "read": true,
    "created_at": "2024-01-01T10:00:00.000Z"
  }
}
```

## Exemplos de Uso
# 1. Criar transação
```
curl -X POST http://localhost:8080/transactions \
-H "Content-Type: application/json" \
-d '{"user_id":"user123","amount":50.00,"type":"debit","description":"Compra"}'
```

# 2. Buscar transações do usuário
```
curl http://localhost:8080/users/user123/transactions
```

# 3. Buscar notificações
```
curl http://localhost:8081/notifications/user123
```
