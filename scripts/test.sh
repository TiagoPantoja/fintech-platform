#!/bin/bash
set -e

kubectl get pods -n fintech-system

kubectl port-forward -n fintech-system svc/transaction-api 8080:8080 &
kubectl port-forward -n fintech-system svc/notification-service 8081:8081 &
sleep 5

curl -f http://localhost:8080/health
curl -f http://localhost:8081/health

TRANSACTION_ID=$(curl -s -X POST http://localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user123","amount":100.50,"type":"credit","description":"Teste"}' \
  | jq -r '.dados.id')

curl -f http://localhost:8080/transactions/$TRANSACTION_ID

curl -f http://localhost:8081/notifications/user123

pkill -f "kubectl port-forward"

echo "Testes passaram"

chmod +x scripts/test.sh