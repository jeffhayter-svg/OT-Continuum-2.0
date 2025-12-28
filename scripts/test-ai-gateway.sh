#!/bin/bash

# ============================================================================
# Test AI Gateway Locally
# ============================================================================
# Usage:
#   ./scripts/test-ai-gateway.sh
#
# Prerequisites:
#   - Supabase running locally: supabase start
#   - .env.local file with GEMINI_API_KEY
#   - User JWT token
# ============================================================================

set -e  # Exit on error

echo "============================================"
echo "AI Gateway Local Test Script"
echo "============================================"
echo ""

# Check if .env.local exists
if [ ! -f "supabase/functions/ai_gateway/.env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "Create it from .env.example:"
    echo "  cp supabase/functions/ai_gateway/.env.example supabase/functions/ai_gateway/.env.local"
    echo "  # Edit .env.local and add your GEMINI_API_KEY"
    exit 1
fi

echo "✅ .env.local found"

# Check if Supabase is running
if ! curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo "❌ Error: Supabase is not running locally"
    echo "Start with: supabase start"
    exit 1
fi

echo "✅ Supabase is running"

# Start the function
echo ""
echo "Starting ai_gateway function..."
echo "Press Ctrl+C to stop"
echo ""

supabase functions serve ai_gateway --env-file supabase/functions/ai_gateway/.env.local --no-verify-jwt

echo ""
echo "============================================"
echo "Test the function with:"
echo "============================================"
echo ""
echo "# Get user token first"
echo "export TOKEN=\$(curl -s http://localhost:54321/auth/v1/token?grant_type=password \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password\"}' | jq -r .access_token)"
echo ""
echo "# Test signal assistant (chat mode)"
echo 'curl -X POST http://localhost:54321/functions/v1/ai_gateway \'
echo '  -H "Authorization: Bearer $TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",'
echo '    "mode": "chat",'
echo '    "use_case": "signal_assistant",'
echo '    "input": {'
echo '      "signal_type": "unauthorized_access",'
echo '      "severity": "high",'
echo '      "description": "Multiple failed login attempts"'
echo '    }'
echo '  }'"'"' | jq'
echo ""
echo "# Test executive summary (report mode)"
echo 'curl -X POST http://localhost:54321/functions/v1/ai_gateway \'
echo '  -H "Authorization: Bearer $TOKEN" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "tenant_id": "550e8400-e29b-41d4-a716-446655440000",'
echo '    "mode": "report",'
echo '    "use_case": "exec_summary",'
echo '    "input": {'
echo '      "period": "Q1 2024",'
echo '      "total_risks": 42,'
echo '      "critical_risks": 8'
echo '    }'
echo '  }'"'"' | jq'
echo ""
