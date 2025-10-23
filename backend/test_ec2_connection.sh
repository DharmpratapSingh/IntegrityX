#!/bin/bash

echo "🔍 TESTING WALACOR EC2 CONNECTION"
echo "=================================="
echo ""

EC2_HOST="13.220.225.175"
EC2_PORT="443"

echo "1️⃣ Testing network connectivity..."
if nc -zv $EC2_HOST $EC2_PORT 2>&1 | grep -q "succeeded\|Connected"; then
    echo "✅ Port $EC2_PORT is OPEN"
else
    echo "❌ Port $EC2_PORT is CLOSED or FILTERED"
    echo "   → EC2 instance is likely STOPPED"
    echo "   → Please start it from AWS Console"
    exit 1
fi

echo ""
echo "2️⃣ Testing Walacor API health endpoint..."
HEALTH_RESPONSE=$(curl -s --max-time 5 https://$EC2_HOST:$EC2_PORT/api/health)
if [ $? -eq 0 ]; then
    echo "✅ Walacor API is responding"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Walacor API is not responding"
    exit 1
fi

echo ""
echo "3️⃣ Testing Walacor authentication..."
LOGIN_RESPONSE=$(curl -s --max-time 5 -X POST https://$EC2_HOST:$EC2_PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Th!51s1T@gMu"}')

if echo "$LOGIN_RESPONSE" | grep -q "token\|success"; then
    echo "✅ Authentication successful"
else
    echo "⚠️ Authentication response: $LOGIN_RESPONSE"
fi

echo ""
echo "4️⃣ Testing IntegrityX backend connection..."
BACKEND_HEALTH=$(curl -s http://localhost:8000/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    WALACOR_STATUS=$(echo "$BACKEND_HEALTH" | grep -o '"walacor":{[^}]*}' || echo "")
    if echo "$WALACOR_STATUS" | grep -q '"status":"up"'; then
        echo "✅ Backend successfully connected to Walacor"
    else
        echo "⚠️ Backend is running but Walacor status unclear"
        echo "   → Try restarting the backend"
    fi
else
    echo "❌ Backend is not running"
    echo "   → Start with: cd backend && python start_server.py"
fi

echo ""
echo "=================================="
echo "🎯 SUMMARY:"
echo "=================================="
echo "EC2 Host: $EC2_HOST:$EC2_PORT"
echo "Status: Check results above"
echo ""
echo "If all tests pass, your system is connected to real Walacor EC2! 🎉"
