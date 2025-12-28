#!/bin/bash

# ============================================================================
# Deploy AI Gateway to Supabase
# ============================================================================
# Usage:
#   ./scripts/deploy-ai-gateway.sh
#
# Prerequisites:
#   - Supabase CLI installed
#   - Linked to Supabase project: supabase link
#   - GEMINI_API_KEY available
# ============================================================================

set -e  # Exit on error

echo "============================================"
echo "AI Gateway Deployment Script"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Error: Not linked to a Supabase project"
    echo "Run: supabase link --project-ref <your-project-id>"
    exit 1
fi

echo "✅ Supabase project linked"

# Prompt for Gemini API key if not already set
echo ""
echo "Checking secrets..."
read -p "Do you want to set/update GEMINI_API_KEY? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Enter your Gemini API Key: " GEMINI_API_KEY
    echo ""
    
    if [ -z "$GEMINI_API_KEY" ]; then
        echo "❌ Error: GEMINI_API_KEY cannot be empty"
        exit 1
    fi
    
    echo "Setting GEMINI_API_KEY..."
    supabase secrets set GEMINI_API_KEY="$GEMINI_API_KEY"
    echo "✅ GEMINI_API_KEY set"
fi

# Prompt for model configuration
read -p "Do you want to configure AI models? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Chat model [gemini-1.5-flash]: " AI_MODEL_CHAT
    AI_MODEL_CHAT=${AI_MODEL_CHAT:-gemini-1.5-flash}
    
    read -p "Report model [gemini-1.5-pro]: " AI_MODEL_REPORT
    AI_MODEL_REPORT=${AI_MODEL_REPORT:-gemini-1.5-pro}
    
    echo "Setting AI models..."
    supabase secrets set AI_MODEL_CHAT="$AI_MODEL_CHAT"
    supabase secrets set AI_MODEL_REPORT="$AI_MODEL_REPORT"
    echo "✅ AI models configured"
fi

# Deploy function
echo ""
echo "Deploying ai_gateway function..."
supabase functions deploy ai_gateway

echo ""
echo "============================================"
echo "✅ Deployment Complete!"
echo "============================================"
echo ""
echo "Function endpoint:"
echo "https://<project-id>.supabase.co/functions/v1/ai_gateway"
echo ""
echo "Test with:"
echo 'curl -X POST https://<project-id>.supabase.co/functions/v1/ai_gateway \'
echo '  -H "Authorization: Bearer <user-token>" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "tenant_id": "<tenant-uuid>",'
echo '    "mode": "chat",'
echo '    "use_case": "signal_assistant",'
echo '    "input": {"test": "data"}'
echo '  }'"'"
echo ""
echo "View logs with:"
echo "supabase functions logs ai_gateway --follow"
echo ""
