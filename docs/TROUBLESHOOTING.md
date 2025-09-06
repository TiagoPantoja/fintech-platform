# Troubleshooting

### 1. Problemas no Banco de Dados

#### Erros:
- Pods em CrashLoopBackOff
- Erro "connection refused" nos logs

### Verificando:
```bash
kubectl logs deployment/transaction-api -n fintech-system
kubectl describe pod -l app=transaction-api -n fintech-system
kubectl get secrets -n crossplane-system
```

### Solução:
- Verificar se RDS está rodando: kubectl get rdsinstance
- Verificar security groups permitem porta 5432
- Verificar credenciais no secret

### 2. Performance Comprometida

#### Erros:
- Alta latência nas APIs
- Timeouts frequentes

### Verificando:
```bash
kubectl top pods -n fintech-system
kubectl get hpa -n fintech-system
kubectl logs deployment/transaction-api -n fintech-system | grep "Erro"
```

### Soluções:
- Verificar métricas
- Ajustar HPA min/max replicas
- Verificar connection pool
- Verificar cache
