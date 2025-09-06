# Arquitetura da Plataforma Fintech

## Projeto
Plataforma cloud-native para processamento de transações financeiras usando Crossplane, Kubernetes e AWS.
## Componentes

### Infraestrutura
- VPC com subnets públicas e privadas
- Cluster EKS com node groups
- RDS PostgreSQL para persistência
- ElastiCache Redis para cache
- Security Groups e IAM Roles

### Serviços
- **Transaction API**: Gerencia transações (porta 8080)
- **Notification Service**: Gerencia notificações (porta 8081)

### Tecnologias
- Express para API
- PostgreSQL para dados
- Redis para cache
- Prometheus para métricas
- Kubernetes para orquestração

## Fluxo de Dados
1. Cliente cria transação via Transaction API
2. Transação salva no PostgreSQL
3. Redis invalidado
4. Webhook para Notification Service
5. Notificação salva em schema separado

## Segurança
- Network Policies
- Secrets para credenciais

## Escalabilidade
- HPA configurado
- Connection pooling no PostgreSQL
- Redis para cache
- Load balancing