#!/bin/bash
set -e

kubectl delete -f k8s/apps/ --ignore-not-found=true
kubectl delete -f k8s/monitoring/ --ignore-not-found=true

kubectl delete -f k8s/security/ --ignore-not-found=true
kubectl delete -f k8s/namespaces/ --ignore-not-found=true

kubectl delete -f crossplane/instances/ --ignore-not-found=true
kubectl delete -f crossplane/compositions/ --ignore-not-found=true
kubectl delete -f crossplane/xrds/ --ignore-not-found=true

kubectl delete -f crossplane/providers/ --ignore-not-found=true

helm uninstall crossplane -n crossplane-system --ignore-not-found
kubectl delete namespace crossplane-system --ignore-not-found=true

docker rmi fintech/transaction-api:latest --force 2>/dev/null || true
docker rmi fintech/notification-service:latest --force 2>/dev/null || true

echo "Cleanup concluído"

chmod +x scripts/cleanup.sh