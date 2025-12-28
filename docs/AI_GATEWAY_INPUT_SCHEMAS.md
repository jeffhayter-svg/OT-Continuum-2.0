# AI Gateway Input Schemas - Quick Reference

## 📋 All Use Cases at a Glance

| Use Case | Mode | Purpose | Output Format |
|----------|------|---------|---------------|
| `signal_assistant` | chat | Analyze signal events | 4-8 bullets (Changed/Cause/Check/Escalate) |
| `risk_assistant` | chat | Assess risk severity/likelihood | Rationale + 3 actions + evidence |
| `exec_summary` | report | Generate executive summary | Markdown + JSON (headline/findings/risks/actions) |
| `mitigation_plan` | report | Create mitigation plan | Markdown + JSON (goal/mitigations/quick_wins/dependencies) |

---

## 1️⃣ Signal Assistant (Chat Mode)

### Purpose
Analyze signal events and provide 4-8 bullets covering:
- **Changed**: What metric changed
- **Cause**: Likely root causes (2-3)
- **Check**: Diagnostic steps (2-3)
- **Escalate if**: Escalation criteria

### Input Schema

```typescript
await callAIGateway({
  tenant_id: "uuid",
  mode: "chat",
  use_case: "signal_assistant",
  
  // FLEXIBLE INPUT - Include what you have
  input: {
    // Option A: Just ask a question
    question?: string;
    
    // Option B: Provide signal details
    signal_type?: string;        // e.g., "heartbeat_failures", "unauthorized_access"
    severity?: string;            // e.g., "high", "critical"
    source?: string;              // e.g., "firewall_logs", "plc_diagnostics"
    value?: number;               // Current value
    threshold?: number;           // Normal threshold
    unit?: string;                // e.g., "count", "percentage"
    timestamp?: string;           // When it happened
    
    // Option C: Free-form data
    [key: string]: any;           // Any other relevant fields
  },
  
  // OPTIONAL CONTEXT
  context?: {
    site_id?: string;
    asset_id?: string;
    asset_type?: string;          // e.g., "PLC", "HMI", "SCADA"
    signal?: string;              // Signal name
    [key: string]: any;
  }
});
```

### Example 1: Simple Question

```typescript
await callAIGateway({
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
```

**Response:**
```
• **Changed**: Failed PLC heartbeat count increased from 2% to 15% over last hour
• **Cause**: Network congestion, cable damage, PLC power issues, or network switch failure
• **Check**: 1) Verify Ethernet cable integrity, 2) Check network switch port status, 3) Review PLC power supply logs
• **Escalate if**: Failures exceed 10% over 15 minutes, or if critical production PLCs affected
```

### Example 2: Detailed Signal Data

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    signal_type: "unauthorized_access",
    severity: "high",
    source: "firewall_logs",
    attempts: 15,
    ip_address: "192.168.1.100",
    timestamp: "2024-12-26T14:30:00Z"
  },
  context: {
    site_id: siteId,
    signal: "unauthorized_access"
  }
});
```

**Response:**
```
• **Changed**: 15 unauthorized access attempts detected from IP 192.168.1.100 in last 30 minutes
• **Cause**: Brute-force attack, compromised credentials, or misconfigured automation script
• **Check**: 1) Review firewall logs for pattern, 2) Check if IP is internal or external, 3) Verify user account status
• **Escalate if**: Attempts continue after blocking IP, or if attempting access to critical systems
```

### Example 3: Custom Fields

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "signal_assistant",
  input: {
    signal_type: "temperature_spike",
    current_temp: 85,
    normal_temp: 65,
    unit: "celsius",
    rate_of_change: 10,  // degrees per minute
    location: "Compressor Room 2"
  },
  context: {
    asset_type: "Compressor",
    asset_id: assetId
  }
});
```

---

## 2️⃣ Risk Assistant (Chat Mode)

### Purpose
Assess risk severity and likelihood with:
- **Severity rationale**: Why this severity level
- **Likelihood rationale**: Why this likelihood level
- **3 recommended actions**: Immediate steps
- **Evidence needed**: What data to collect

### Input Schema

```typescript
await callAIGateway({
  tenant_id: "uuid",
  mode: "chat",
  use_case: "risk_assistant",
  
  input: {
    // REQUIRED
    risk_title: string;           // e.g., "Unpatched SCADA system"
    
    // RECOMMENDED
    current_severity?: string;    // e.g., "major", "catastrophic"
    current_likelihood?: string;  // e.g., "likely", "possible"
    description?: string;         // Detailed description
    
    // OPTIONAL
    existing_controls?: string;   // Current mitigations
    last_patch_date?: string;     // When last patched
    affected_assets?: number;     // How many assets affected
    budget?: number;              // Available budget
    timeline?: string;            // Desired timeline
    
    [key: string]: any;           // Any other relevant fields
  },
  
  context?: {
    site_id?: string;
    risk_id?: string;
    risk_category?: string;       // e.g., "cybersecurity", "safety"
    [key: string]: any;
  }
});
```

### Example 1: Cybersecurity Risk

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "risk_assistant",
  input: {
    risk_title: "Unpatched SCADA system",
    current_severity: "major",
    current_likelihood: "likely",
    description: "Windows 7 HMI with no patches since 2022",
    last_patch_date: "2022-03-15",
    affected_assets: 5,
    existing_controls: "Air-gapped network, physical access control"
  },
  context: {
    site_id: siteId,
    risk_category: "cybersecurity"
  }
});
```

**Response:**
```
**Severity: Major** - Justified because unpatched Windows 7 has known critical vulnerabilities (CVE-2022-xxxx) that could allow remote code execution. With 5 affected assets, compromise could disrupt production.

**Likelihood: Likely** - Air-gap reduces external attack surface, but USB-based malware (Stuxnet-style) remains high risk. Physical access controls help but don't prevent insider threats.

**Recommended Actions:**
1. Immediate: Implement application whitelisting on all 5 HMI systems
2. Short-term (30 days): Deploy network monitoring to detect anomalous behavior
3. Long-term (6 months): Budget for Windows 10 IoT Enterprise upgrade with patch management

**Evidence Needed:**
- Network traffic logs for last 90 days
- USB access audit logs
- List of approved applications
- Vendor support status for SCADA software on Windows 10
```

### Example 2: Safety Risk

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "chat",
  use_case: "risk_assistant",
  input: {
    risk_title: "Emergency shutdown system not tested",
    current_severity: "catastrophic",
    current_likelihood: "possible",
    description: "E-stop system last tested 18 months ago, policy requires quarterly testing",
    last_test_date: "2023-06-15",
    affected_assets: 12,
    existing_controls: "Redundant shutdown circuits, trained operators"
  }
});
```

---

## 3️⃣ Executive Summary (Report Mode)

### Purpose
Generate executive summary with:
- **Headline**: 1-sentence summary
- **Top findings**: 3-5 key findings
- **Risks**: Critical and high risks
- **Recommended actions**: Priority actions

### Input Schema

```typescript
await callAIGateway({
  tenant_id: "uuid",
  mode: "report",
  use_case: "exec_summary",
  
  input: {
    // RECOMMENDED
    period: string;               // e.g., "Q1 2024", "December 2024"
    total_risks?: number;         // Total risks in register
    critical_risks?: number;      // Count of critical risks
    high_risks?: number;          // Count of high risks
    medium_risks?: number;
    low_risks?: number;
    
    // OPTIONAL METRICS
    patching_coverage?: number;   // Percentage (0-100)
    open_vulnerabilities?: number;
    signals_processed?: number;
    incidents?: number;
    mttr?: number;                // Mean time to resolve (hours)
    compliance_score?: number;    // Percentage (0-100)
    
    // CUSTOM DATA
    [key: string]: any;
  },
  
  context?: {
    site_id?: string;
    report_type?: string;
    [key: string]: any;
  }
});
```

### Example

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "report",
  use_case: "exec_summary",
  input: {
    period: "Q4 2024",
    total_risks: 42,
    critical_risks: 8,
    high_risks: 15,
    medium_risks: 12,
    low_risks: 7,
    patching_coverage: 45,
    open_vulnerabilities: 23,
    signals_processed: 1547,
    incidents: 3,
    mttr: 4.5
  },
  context: {
    site_id: siteId,
    report_type: "quarterly"
  }
});
```

**Response (result.output):**
```markdown
# Q4 2024 OT Security Executive Summary

## Headline
Critical patching gaps (45% coverage) drove 8 critical risks, requiring immediate action on legacy SCADA systems.

## Key Findings
1. **Patching Coverage Below Target**: 45% coverage vs 80% target, leaving 23 open vulnerabilities
2. **Critical Risk Concentration**: 8 critical risks (19% of total) concentrated in legacy PLCs
3. **Incident Response Improving**: MTTR reduced to 4.5 hours (from 6.2 hours last quarter)
4. **Signal Processing Stable**: 1,547 signals processed with 99.8% uptime

## Risk Profile
...
```

**Response (result.structured):**
```json
{
  "headline": "Critical patching gaps (45% coverage) drove 8 critical risks...",
  "top_findings": [
    "Patching Coverage Below Target: 45% coverage vs 80% target",
    "Critical Risk Concentration: 8 critical risks in legacy PLCs",
    "Incident Response Improving: MTTR reduced to 4.5 hours"
  ],
  "risks": {
    "critical": 8,
    "high": 15,
    "trend": "increasing"
  },
  "recommended_actions": [
    "Emergency patching program for 23 open vulnerabilities (30 days)",
    "Legacy PLC replacement roadmap (6 months)",
    "Increase patching coverage to 80% (90 days)"
  ]
}
```

---

## 4️⃣ Mitigation Plan (Report Mode)

### Purpose
Generate mitigation plan with:
- **Goal**: What we're trying to achieve
- **Mitigations**: 3-5 mitigation steps
- **Quick wins**: 2-3 quick wins
- **Dependencies**: Prerequisites and constraints

### Input Schema

```typescript
await callAIGateway({
  tenant_id: "uuid",
  mode: "report",
  use_case: "mitigation_plan",
  
  input: {
    // REQUIRED
    risk_title: string;           // e.g., "Legacy PLC vulnerabilities"
    
    // RECOMMENDED
    severity: string;             // e.g., "major", "catastrophic"
    likelihood: string;           // e.g., "likely", "possible"
    description?: string;
    
    // OPTIONAL CONSTRAINTS
    budget?: number;              // Available budget (USD)
    timeline?: string;            // e.g., "6 months", "Q1 2025"
    resources?: string;           // Available resources
    assets_affected?: number;
    business_impact?: string;
    
    [key: string]: any;
  },
  
  context?: {
    site_id?: string;
    risk_id?: string;
    [key: string]: any;
  }
});
```

### Example

```typescript
await callAIGateway({
  tenant_id: tenantId,
  mode: "report",
  use_case: "mitigation_plan",
  input: {
    risk_title: "Legacy PLC vulnerabilities",
    severity: "major",
    likelihood: "likely",
    description: "12 Allen-Bradley PLCs running firmware from 2015 with known CVEs",
    budget: 150000,
    timeline: "6 months",
    assets_affected: 12,
    business_impact: "Production line downtime if compromised"
  },
  context: {
    site_id: siteId,
    risk_id: riskId
  }
});
```

**Response (result.output):**
```markdown
# Mitigation Plan: Legacy PLC Vulnerabilities

## Goal
Reduce risk from major/likely to moderate/unlikely by upgrading firmware and implementing network segmentation within 6 months and $150k budget.

## Mitigation Steps
1. **Network Segmentation (Month 1-2)**: Deploy industrial firewall to isolate PLCs from corporate network
   - Cost: $25k
   - Reduces likelihood from "likely" to "possible"
   
2. **Firmware Assessment (Month 2)**: Vendor assessment of firmware upgrade compatibility
   - Cost: $5k
   - Risk: Some PLCs may require replacement if incompatible

3. **Phased Firmware Upgrade (Month 3-5)**: Upgrade 12 PLCs during planned maintenance windows
   - Cost: $60k (includes vendor support)
   - Reduces severity from "major" to "moderate"

...
```

**Response (result.structured):**
```json
{
  "goal": "Reduce risk from major/likely to moderate/unlikely within 6 months and $150k budget",
  "mitigations": [
    {
      "step": "Network Segmentation",
      "timeline": "Month 1-2",
      "cost": 25000,
      "impact": "Reduces likelihood from likely to possible"
    },
    {
      "step": "Firmware Assessment",
      "timeline": "Month 2",
      "cost": 5000,
      "risk": "Some PLCs may require replacement"
    }
  ],
  "quick_wins": [
    "Deploy network monitoring to existing firewall (Week 1, $0)",
    "Implement application whitelisting on HMIs (Week 2, $2k)"
  ],
  "dependencies": [
    "Vendor support contract required for firmware upgrades",
    "Maintenance windows must be coordinated with production schedule"
  ]
}
```

---

## 💡 Pro Tips

### 1. Input is Flexible
The AI Gateway accepts **any fields** in the `input` object. The prompts are designed to work with whatever data you provide.

```typescript
// Minimal
input: { question: "What's the risk?" }

// Detailed
input: { 
  signal_type: "...", 
  severity: "...",
  custom_field_1: "...",
  custom_field_2: "..."
}
```

### 2. Context is Optional
Use `context` to provide additional metadata that helps the AI but isn't core to the analysis:

```typescript
context: {
  site_id: siteId,
  asset_id: assetId,
  asset_type: "PLC",
  industry: "manufacturing",
  compliance_framework: "NIST CSF"
}
```

### 3. Chat vs Report Mode

**Chat Mode** (`signal_assistant`, `risk_assistant`):
- Returns plain text (bullets or paragraphs)
- Fast responses (2-3 seconds)
- Use for interactive Q&A

**Report Mode** (`exec_summary`, `mitigation_plan`):
- Returns markdown + structured JSON
- Slower responses (5-10 seconds)
- Use for documents and dashboards

### 4. Error Handling

```typescript
try {
  const result = await callAIGateway({ ... });
  console.log(result.output);
} catch (err) {
  if (err.message === 'NO_ACTIVE_SESSION') {
    // User not logged in
    router.push('/login');
  } else if (err.message.includes('AI_GATEWAY_ERROR 429')) {
    // Rate limit
    alert('Too many requests, please wait');
  } else if (err.message.includes('AI_GATEWAY_ERROR 500')) {
    // Server error
    alert('AI service temporarily unavailable');
  } else {
    // Unknown error
    console.error('AI Gateway error:', err);
  }
}
```

---

## 📚 See Also

- **Live Examples**: `/examples/AIGatewayUsageExamples.tsx`
- **Full Prompts**: `/supabase/functions/ai_gateway/PROMPTS.md`
- **Deployment Guide**: `/supabase/functions/ai_gateway/DEPLOY.md`
- **API Client**: `/lib/callAIGateway.ts`

---

**Last Updated**: December 26, 2024  
**Version**: 1.0.0
