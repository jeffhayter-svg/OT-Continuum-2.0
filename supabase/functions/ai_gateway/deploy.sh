#!/bin/bash

# ============================================================================
# One-Command Deploy Script for AI Gateway
# ============================================================================
# This script will deploy the ai_gateway Edge Function to Supabase
# 
# Usage:
#   chmod +x supabase/functions/ai_gateway/deploy.sh
#   ./supabase/functions/ai_gateway/deploy.sh
#
# Prerequisites:
#   - Supabase CLI installed: npm install -g supabase
#   - Project linked: supabase link --project-ref your-project-id
#   - GEMINI_API_KEY set: supabase secrets set GEMINI_API_KEY=your-key
# ============================================================================

set -e

echo "============================================"
echo "Deploying ai_gateway Edge Function"
echo "============================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if project is linked
if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/config.toml" ]; then
    echo "❌ Error: Not linked to a Supabase project"
    echo "Run: supabase link --project-ref your-project-id"
    exit 1
fi

echo "✅ Project linked"

# Deploy the function
echo ""
echo "Deploying ai_gateway function..."
supabase functions deploy ai_gateway

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Set secrets if not already done:"
echo "   supabase secrets set GEMINI_API_KEY=your-key"
echo ""
echo "2. Test the function:"
echo '   curl -X POST https://PROJECT.supabase.co/functions/v1/ai_gateway \'
echo '     -H "Authorization: Bearer TOKEN" \'
echo '     -H "Content-Type: application/json" \'
echo '     -d '"'"'{"tenant_id":"UUID","mode":"chat","use_case":"signal_assistant","input":{}}'"'"
echo ""
echo "3. View logs:"
echo "   supabase functions logs ai_gateway --follow"
echo ""
