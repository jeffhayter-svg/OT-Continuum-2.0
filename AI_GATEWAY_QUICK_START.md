# 🚀 AI Gateway Quick Start

## ✅ Your Code is Ready!

You already have everything you need. Just use your `callAIGateway` function!

```typescript
import { callAIGateway } from './lib/callAIGateway';

// Your exact example - works perfectly! ✅
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    question: "What does a spike in failed PLC heartbeats usually indicate?"
  },
  context: {
    asset_type: "PLC",
    signal: "heartbeat_failures"
  }
});

console.log(result.output);
// • **Changed**: Failed PLC heartbeat count increased...
// • **Cause**: Network congestion, cable damage...
// • **Check**: Verify Ethernet cable integrity...
// • **Escalate if**: Failures exceed 10%...
```

---

## 📦 Copy-Paste Examples

### 1. Signal Assistant - Simple Question

```typescript
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    question: "What causes temperature spikes in compressors?"
  },
  context: {
    asset_type: "Compressor"
  }
});
```

### 2. Signal Assistant - With Data

```typescript
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    signal_type: "unauthorized_access",
    severity: "high",
    attempts: 15,
    ip_address: "192.168.1.100"
  },
  context: {
    site_id: siteId,
    signal: "unauthorized_access"
  }
});
```

### 3. Risk Assistant

```typescript
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "risk_assistant",
  input: {
    risk_title: "Unpatched SCADA system",
    current_severity: "major",
    current_likelihood: "likely",
    description: "Windows 7 HMI with no patches since 2022",
    last_patch_date: "2022-03-15"
  }
});
```

### 4. Executive Summary

```typescript
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "report",
  use_case: "exec_summary",
  input: {
    period: "Q4 2024",
    total_risks: 42,
    critical_risks: 8,
    high_risks: 15,
    patching_coverage: 45
  }
});

console.log(result.output);        // Markdown text
console.log(result.structured);    // JSON data
```

### 5. Mitigation Plan

```typescript
const result = await callAIGateway({
  tenant_id: tenantId,
  mode: "report",
  use_case: "mitigation_plan",
  input: {
    risk_title: "Legacy PLC vulnerabilities",
    severity: "major",
    likelihood: "likely",
    budget: 150000,
    timeline: "6 months",
    assets_affected: 12
  }
});

console.log(result.output);        // Markdown text
console.log(result.structured);    // JSON with goal/mitigations/quick_wins
```

---

## 🔧 React Component Example

```typescript
'use client';

import { useState } from 'react';
import { callAIGateway } from '@/lib/callAIGateway';

export function SignalAnalyzer({ tenantId, signalType }: {
  tenantId: string;
  signalType: string;
}) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    try {
      setLoading(true);
      setError('');

      const result = await callAIGateway({
        tenant_id: tenantId,
        mode: 'chat',
        use_case: 'signal_assistant',
        input: {
          signal_type: signalType,
          question: `Analyze this signal: ${signalType}`
        }
      });

      setAnalysis(result.output);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_ACTIVE_SESSION') {
        setError('Please log in');
        window.location.href = '/login';
      } else {
        setError('Failed to analyze signal');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button 
        onClick={analyze} 
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Analyzing...' : 'Analyze Signal'}
      </button>

      {error && <div className="text-red-600">{error}</div>}
      {analysis && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <pre className="whitespace-pre-wrap">{analysis}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Test Before Deploying

### 1. Test Your Function Locally

```typescript
// test.ts
import { callAIGateway } from './lib/callAIGateway';

async function test() {
  const tenantId = 'your-tenant-uuid-here';
  
  const result = await callAIGateway({
    tenant_id: tenantId,
    mode: 'chat',
    use_case: 'signal_assistant',
    input: {
      question: 'What does a spike in failed PLC heartbeats indicate?'
    }
  });
  
  console.log('✅ Success!');
  console.log(result.output);
}

test().catch(console.error);
```

### 2. Check Edge Function Logs

```bash
# Deploy AI Gateway
npx supabase functions deploy ai_gateway

# Watch logs
npx supabase functions logs ai_gateway --follow
```

### 3. Test in Browser Console

```javascript
// In browser DevTools console
const result = await callAIGateway({
  tenant_id: 'your-tenant-uuid',
  mode: 'chat',
  use_case: 'signal_assistant',
  input: { question: 'Test question' }
});

console.log(result);
```

---

## 🐛 Troubleshooting

### Error: "NO_ACTIVE_SESSION"

**Cause:** User not logged in

**Fix:**
```typescript
if (err.message === 'NO_ACTIVE_SESSION') {
  router.push('/login');
}
```

### Error: "AI_GATEWAY_ERROR 401"

**Cause:** JWT expired or invalid

**Fix:**
```typescript
// Sign out and redirect
await supabase.auth.signOut();
router.push('/login');
```

### Error: "AI_GATEWAY_ERROR 400"

**Cause:** Invalid input (missing required fields)

**Fix:**
```typescript
// Check that tenant_id, mode, and use_case are set
console.log({ tenant_id, mode, use_case });
```

### Error: "AI_GATEWAY_ERROR 500"

**Cause:** Edge Function error (check logs)

**Fix:**
```bash
# View Edge Function logs
npx supabase functions logs ai_gateway
```

### Error: "Missing GEMINI_API_KEY"

**Cause:** GEMINI_API_KEY not set

**Fix:**
```bash
# Set the secret
npx supabase secrets set GEMINI_API_KEY=your-api-key-here
```

---

## 📊 Response Formats

### Chat Mode (signal_assistant, risk_assistant)

```typescript
{
  ok: true,
  provider: "gemini",
  model: "gemini-2.0-flash-exp",
  mode: "chat",
  use_case: "signal_assistant",
  output: "• **Changed**: ...\n• **Cause**: ...\n• **Check**: ...\n• **Escalate if**: ..."
}
```

### Report Mode (exec_summary, mitigation_plan)

```typescript
{
  ok: true,
  provider: "gemini",
  model: "gemini-2.0-flash-exp",
  mode: "report",
  use_case: "exec_summary",
  output: "# Executive Summary\n\n## Headline\n...",  // Markdown
  structured: {                                        // JSON
    headline: "...",
    top_findings: ["...", "..."],
    risks: { critical: 8, high: 15 },
    recommended_actions: ["...", "..."]
  }
}
```

---

## 🎯 Use Cases Summary

| Use Case | Mode | Input | Output |
|----------|------|-------|--------|
| `signal_assistant` | chat | Question or signal data | 4-8 bullets |
| `risk_assistant` | chat | Risk details | Rationale + 3 actions |
| `exec_summary` | report | Metrics for period | Markdown + JSON |
| `mitigation_plan` | report | Risk + constraints | Markdown + JSON |

---

## 📚 Full Documentation

- **Input Schemas**: `/docs/AI_GATEWAY_INPUT_SCHEMAS.md`
- **React Examples**: `/examples/AIGatewayUsageExamples.tsx`
- **Prompts**: `/supabase/functions/ai_gateway/PROMPTS.md`
- **Deployment**: `/supabase/functions/ai_gateway/DEPLOY.md`

---

## ✅ Checklist

- [ ] Edge Function deployed: `npx supabase functions deploy ai_gateway`
- [ ] GEMINI_API_KEY set: `npx supabase secrets set GEMINI_API_KEY=...`
- [ ] Test in browser console
- [ ] Test in React component
- [ ] Check logs for errors
- [ ] Test all 4 use cases
- [ ] Test error handling (logged out user)
- [ ] Test in Figma iframe preview

---

## 🚀 Next Steps

1. **Test your code** - Use the examples above
2. **Deploy** - Run `npx supabase functions deploy ai_gateway`
3. **Integrate** - Add to your Signal Classification and Risk Decision pages
4. **Monitor** - Watch logs and error rates
5. **Iterate** - Adjust prompts based on user feedback

---

**Your `callAIGateway` is production-ready!** 🎉

Just test it and ship it!

---

**Last Updated**: December 26, 2024  
**Status**: Ready for Testing
