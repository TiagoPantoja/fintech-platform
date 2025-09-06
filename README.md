# Plataforma Fintech

Solução para processamento de transações financeiras usando Crossplane, Kubernetes e AWS.

## Arquitetura

- **Transaction API**: Gerencia transações
- **Notification Service**: Gerencia notificações
- **Infraestrutura**: AWS via Crossplane (EKS, RDS, Redis)
- **Monitoramento**: Prometheus

## Instalação

### Pré-requisitos
- kubectl
- Helm 3.x
- Docker
- Credenciais AWS

### Deploy
```bash
export AWS_ACCESS_KEY_ID="sua-key"
export AWS_SECRET_ACCESS_KEY="sua-secret"
./scripts/deploy.sh
```

### Teste
```bash
./scripts/test.sh
```

### Cleanup
```bash
./scripts/cleanup.sh
```

### APIs

### Transaction API (Porta 8080)

`POST /transactions` - Cria transação

`GET /transactions/:id` - Busca transação

`GET /users/:id/transactions` - Transações do usuário

### Notification Service (Porta 8081)

`POST /notify` - Envia notificação

`GET /notifications/:userId` - Notificações do usuário

### Acesso Local
```bash
kubectl port-forward svc/transaction-api 8080:8080 -n fintech-system
kubectl port-forward svc/notification-service 8081:8081 -n fintech-system
```

