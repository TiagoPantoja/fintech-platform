#!/bin/bash
set -e

kubectl cluster-info > /dev/null

kubectl create namespace crossplane-system --dry-run=client -o yaml | kubectl apply -f -
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm upgrade --install crossplane crossplane-stable/crossplane --namespace crossplane-system --wait

kubectl apply -f crossplane/providers/
kubectl wait --for=condition=healthy provider.pkg.crossplane.io/provider-aws --timeout=300s

if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$AWS_SECRET_ACCESS_KEY" ]]; then
    kubectl create secret generic aws-secret -n crossplane-system \
        --from-literal=creds="[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY" \
        --dry-run=client -o yaml | kubectl apply -f -
fi

kubectl apply -f crossplane/xrds/
kubectl apply -f crossplane/compositions/
kubectl apply -f crossplane/instances/

kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/security/

docker build -t fintech/transaction-api:latest docker/transaction-api/
docker build -t fintech/notification-service:latest docker/notification-service/

kubectl apply -f k8s/apps/
kubectl apply -f k8s/monitoring/

kubectl wait --for=condition=ready pod -l app=transaction-api -n fintech-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=notification-service -n fintech-system --timeout=300s

echo "Deploy concluído"

chmod +x scripts/deploy.sh