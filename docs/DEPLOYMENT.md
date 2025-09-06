# Guia de Deploy

## Pré-requisitos
- kubectl configurado
- Helm 3.x instalado
- Docker instalado
- Credenciais AWS configuradas

## Variáveis de Ambiente
```bash
export AWS_ACCESS_KEY_ID="sua-access-key"
export AWS_SECRET_ACCESS_KEY="sua-secret-key"
export DOCKER_REGISTRY="seu-registry"
```

## Deploy Completo
```bash
./scripts/deploy.sh
```

## Deploy Manual

### 1. Crossplane
```bash
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm install crossplane crossplane-stable/crossplane -n crossplane-system --create-namespace
```

### 2. Provedor AWS
```bash
kubectl apply -f crossplane/providers/
kubectl apply -f crossplane/xrds/
kubectl apply -f crossplane/compositions/
kubectl apply -f crossplane/instances/
```

### 3. Aplicações
```bash
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/security/
kubectl apply -f k8s/apps/
kubectl apply -f k8s/monitoring/
```

### 4. Verificação
```bash
kubectl get pods -n fintech-system
kubectl get fintechplatform fintech-dev
```

### Acesso

- Transaction API: kubectl port-forward svc/transaction-api 8080:8080
- Notification Service: kubectl port-forward svc/notification-service 8081:8081
- Prometheus: kubectl port-forward svc/prometheus-service 9090:9090

### Cleanup
```bash
./scripts/cleanup.sh
```