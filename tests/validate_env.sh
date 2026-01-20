#!/bin/bash

# Eurusys Watchtower: Integration & Environment Validation Script
# Matches JD requirement: "Support end-to-end feature implementation... environment validation"

echo "🛡️ Starting Watchtower Environment Validation..."

SERVICES=(
    "http://localhost:4004/health"
    "http://localhost:5001/health"
    "http://localhost:8081/health"
    "http://localhost:4005/health"
)

for service in "${SERVICES[@]}"
do
    echo "Checking $service..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $service)
    if [ $STATUS -eq 200 ]; then
        echo "✅ Service is UP"
    else
        echo "❌ Service is DOWN (Status: $STATUS)"
    fi
done

echo "🛡️ Validation Complete."
