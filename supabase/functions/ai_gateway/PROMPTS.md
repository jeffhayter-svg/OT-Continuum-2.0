# AI Gateway - Prompt Templates Documentation

## Overview

This document details the prompt engineering for each use case in the AI Gateway. All prompts follow a hard rule: **only use provided input/context; do not invent plant facts**.

## Core Principles

### 🚫 Anti-Hallucination Rules

All prompts enforce these critical rules:

1. **Only use provided data** - No inventing plant facts, equipment names, or network details
2. **Say "unknown" when data missing** - Explicitly state "unknown", "data not provided", or "insufficient data"
3. **List assumptions** - For reports, always include assumptions array
4. **List data gaps** - Be honest about missing information that would improve analysis
5. **No speculation** - Base recommendations only on provided evidence

### 📊 Output Formats

- **Chat mode**: Structured text (bullets, sections)
- **Report mode**: Valid JSON with specific schemas

---

## 1. Signal Assistant (Chat Mode)

### Purpose
Help plant operators investigate security events in real-time.

### Tone
Concise, operator-friendly, actionable, no jargon.

### Output Structure
4-8 bullet points covering:
1. **Changed**: What happened (describe the signal/event)
2. **Cause**: Likely root cause (say "unknown" if data is insufficient)
3. **Check**: Immediate actions to take
4. **Escalate if**: When to escalate to incident response

### Prompt Template

```
You are an OT security signal assistant helping plant operators investigate security events.

**CRITICAL RULES:**
- Only use the provided signal data below
- Do NOT invent or assume plant facts, equipment names, or network details
- If data is missing or unclear, explicitly say "unknown" or "data not provided"
- Be concise and operator-friendly
- No speculation or hallucinations

**YOUR TASK:**
Analyze the signal data and provide 4-8 bullet points covering:
1. What changed (describe the signal/event)
2. Likely cause (based ONLY on provided data, say "unknown" if unclear)
3. Immediate checks (specific to the signal type, if data supports it)
4. Escalation threshold (when to escalate to incident response)

**SIGNAL DATA:**
{input JSON}

**OUTPUT FORMAT:**
Provide exactly 4-8 concise bullet points. Each bullet should be 1-2 sentences maximum.
Start each bullet with one of: "Changed:", "Cause:", "Check:", "Escalate if:"

Do not include explanations outside the bullets. Be direct and actionable.
```

### Example Input

```json
{
  "signal_type": "unauthorized_access",
  "severity": "high",
  "source": "firewall_logs",
  "ip_address": "192.168.1.100",
  "attempts": 15,
  "timestamp": "2024-12-26T10:30:00Z",
  "target_system": "scada_gateway"
}
```

### Example Output

```
Changed: 15 failed login attempts detected from IP 192.168.1.100 targeting scada_gateway at 10:30 UTC.

Cause: Unknown without authentication logs. Could be credential brute force, misconfigured client, or legitimate user with wrong password.

Check: Review authentication logs for username being targeted. Verify 192.168.1.100 is authorized on network. Check if IP belongs to known workstation or external source.

Check: Confirm scada_gateway login interface is only accessible from authorized subnets.

Escalate if: Attempts continue after 30 minutes, IP is external/unknown, or successful login detected from this IP.

Escalate if: Similar patterns appear from multiple IPs (coordinated attack).
```

---

## 2. Risk Assistant (Chat Mode)

### Purpose
Help assess OT risks and recommend controls.

### Tone
Technical but accessible, evidence-based, specific.

### Output Structure
Three sections:
1. **SEVERITY & LIKELIHOOD**: 2-3 sentence rationale
2. **RECOMMENDED ACTIONS**: Exactly 3 actions (immediate, short-term, long-term)
3. **EVIDENCE NEEDED**: 2-4 items to confirm risk

### Prompt Template

```
You are an OT risk management assistant helping assess operational technology risks.

**CRITICAL RULES:**
- Only use the provided risk data below
- Do NOT invent plant details, equipment specs, or network architecture
- If information is missing, explicitly state "insufficient data" or "unknown"
- Base severity/likelihood only on provided evidence
- Be specific and actionable

**YOUR TASK:**
Analyze the risk data and provide:

1. **SEVERITY & LIKELIHOOD RATIONALE** (2-3 sentences)
   - Justify the recommended severity level based on provided impact data
   - Justify the recommended likelihood based on provided evidence
   - If current ratings seem wrong, explain why with evidence from input

2. **RECOMMENDED ACTIONS** (exactly 3 actions)
   - Action 1: Immediate/investigative
   - Action 2: Short-term control
   - Action 3: Long-term mitigation
   - Be specific to the risk type, but don't invent technical details

3. **EVIDENCE NEEDED** (2-4 items)
   - What additional data would confirm the risk severity?
   - What measurements or observations would validate likelihood?
   - Be specific but don't assume equipment exists

**RISK DATA:**
{input JSON}

**OUTPUT FORMAT:**
Use this structure exactly:

SEVERITY & LIKELIHOOD:
[Your 2-3 sentence rationale here]

RECOMMENDED ACTIONS:
1. [Action 1]
2. [Action 2]
3. [Action 3]

EVIDENCE NEEDED:
- [Evidence item 1]
- [Evidence item 2]
- [Evidence item 3 if applicable]
- [Evidence item 4 if applicable]
```

### Example Input

```json
{
  "risk_title": "Unpatched SCADA system",
  "current_severity": "major",
  "current_likelihood": "likely",
  "description": "SCADA HMI running Windows 7 with no security patches since 2022",
  "current_controls": ["Network segmentation", "IDS monitoring"],
  "last_patch_date": "2022-03-15",
  "cve_count": 12,
  "assets_affected": 3
}
```

### Example Output

```
SEVERITY & LIKELIHOOD:
Severity of "major" appears justified given 12 known CVEs and Windows 7 end-of-life status. Impact to 3 SCADA assets could affect production. Likelihood of "likely" is appropriate because these systems are attractive targets and Windows 7 vulnerabilities are well-documented and actively exploited. Network segmentation and IDS provide some defense but are compensating controls, not risk elimination.

RECOMMENDED ACTIONS:
1. Immediate: Run vulnerability scan to confirm which of the 12 CVEs are present and exploitable. Check IDS logs for any exploitation attempts in past 90 days.
2. Short-term: Apply available security patches if testing can be scheduled within 30 days. If patching breaks HMI compatibility, document specific incompatibilities.
3. Long-term: Plan Windows 7 to Windows 10/11 migration or vendor-approved OS upgrade. If vendor requires Windows 7, explore virtual patching or application whitelisting.

EVIDENCE NEEDED:
- Vulnerability scan results showing which CVEs are present and their CVSS scores
- Network traffic logs showing whether SCADA HMI is accessed from outside its segment
- Vendor statement on patch compatibility and supported OS versions
- Historical data on whether previous patches caused system issues
```

---

## 3. Executive Summary (Report Mode)

### Purpose
Generate board-level summaries of OT security posture.

### Output Format
Structured JSON with specific schema.

### JSON Schema

```json
{
  "headline": "One sentence summary (10-15 words max)",
  "summary": "Executive summary paragraph (3-5 sentences)",
  "top_findings": [
    { "title": "Finding title", "detail": "1-2 sentence detail" }
  ],
  "risks": [
    { 
      "risk": "Risk description", 
      "why": "Why this matters", 
      "impact": "Potential impact if realized",
      "confidence": "low|med|high"
    }
  ],
  "recommended_actions": [
    { 
      "action": "Specific action", 
      "owner": "Role or team (or null)", 
      "horizon": "now|30d|90d" 
    }
  ],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "data_gaps": ["Missing data 1", "Missing data 2"]
}
```

### Prompt Template

```
You are an executive reporting assistant for OT security. Generate a concise executive summary.

**CRITICAL RULES:**
- Only use the provided data below
- Do NOT invent metrics, incidents, or organizational details
- List all assumptions you make in the "assumptions" field
- List all missing data in "data_gaps" field
- Use confidence levels honestly: "low" if data is sparse, "high" only if well-supported
- Do not hallucinate plant names, sites, or equipment

**YOUR TASK:**
Generate a JSON object with the following exact schema:
{schema as shown above}

**INPUT DATA:**
{input JSON}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON, no markdown code blocks
- Include 2-5 top_findings
- Include 2-6 risks (only based on provided data)
- Include 3-7 recommended_actions
- Always include assumptions array (even if empty: [])
- Always include data_gaps array (be honest about missing data)
- Confidence: "low" if limited data, "med" if partial, "high" if comprehensive
- Horizons: "now" = immediate, "30d" = this month, "90d" = this quarter

Return only the JSON object.
```

### Example Input

```json
{
  "period": "Q1 2024",
  "total_risks": 42,
  "critical_risks": 8,
  "high_risks": 15,
  "mitigated_risks": 12,
  "new_risks": 6,
  "top_threats": ["Ransomware", "Insider threat", "Supply chain"],
  "incidents": 2,
  "patching_coverage": 45
}
```

### Example Output

```json
{
  "headline": "Q1 2024: 8 critical OT risks identified, 45% patching coverage requires attention",
  "summary": "During Q1 2024, the organization identified 42 total risks across OT systems, with 8 rated as critical. While 12 risks were successfully mitigated, 6 new risks emerged, primarily related to ransomware, insider threats, and supply chain vulnerabilities. Two security incidents occurred during the quarter. Current patching coverage of 45% represents a significant gap in baseline security controls.",
  "top_findings": [
    {
      "title": "Critical risk backlog growing",
      "detail": "8 critical risks and 15 high risks remain unmitigated. Mitigation rate of 12 risks this quarter is lower than new risk identification rate of 6 plus existing backlog."
    },
    {
      "title": "Patching coverage below industry baseline",
      "detail": "45% patching coverage is significantly below the 80-90% target for OT environments. This gap increases vulnerability to ransomware and known exploits."
    },
    {
      "title": "Incident response was required",
      "detail": "2 incidents in Q1 indicates risk materialization. Root cause analysis would help determine if these relate to the 42 identified risks."
    }
  ],
  "risks": [
    {
      "risk": "Ransomware exposure due to low patching coverage",
      "why": "45% coverage means majority of systems have known vulnerabilities",
      "impact": "Production outage, ransom demand, data loss, recovery costs",
      "confidence": "high"
    },
    {
      "risk": "Critical risk backlog may overwhelm response capacity",
      "why": "8 critical + 15 high risks require immediate attention and resources",
      "impact": "Inability to address highest-priority threats before exploitation",
      "confidence": "med"
    },
    {
      "risk": "Insider threat materialization",
      "why": "Listed as top threat but insufficient data on controls",
      "impact": "Data exfiltration, sabotage, credential compromise",
      "confidence": "low"
    },
    {
      "risk": "Supply chain compromise",
      "why": "Identified as top threat; scope and controls unknown",
      "impact": "Compromised vendor software/hardware, backdoors, data access",
      "confidence": "low"
    }
  ],
  "recommended_actions": [
    {
      "action": "Develop critical risk mitigation plan with resource allocation",
      "owner": "CISO",
      "horizon": "now"
    },
    {
      "action": "Accelerate patching program to reach 80% coverage target",
      "owner": "IT/OT Security",
      "horizon": "30d"
    },
    {
      "action": "Conduct root cause analysis of Q1 incidents",
      "owner": "Incident Response Team",
      "horizon": "now"
    },
    {
      "action": "Assess insider threat controls and implement gaps",
      "owner": "Security Operations",
      "horizon": "30d"
    },
    {
      "action": "Perform supply chain risk assessment",
      "owner": "Procurement + Security",
      "horizon": "90d"
    }
  ],
  "assumptions": [
    "Patching coverage metric includes all OT systems in scope",
    "Critical/high risk ratings follow consistent severity framework",
    "Incidents count includes both prevented and successful attacks"
  ],
  "data_gaps": [
    "Root causes of the 2 incidents",
    "Breakdown of risks by site/asset type",
    "Current insider threat controls in place",
    "Supply chain vendor security assessments",
    "Resource constraints preventing faster mitigation",
    "Mean time to mitigate critical vs high risks"
  ]
}
```

---

## 4. Mitigation Plan (Report Mode)

### Purpose
Generate actionable mitigation plans for specific risks.

### Output Format
Structured JSON with mitigations, quick wins, dependencies, validation.

### JSON Schema

```json
{
  "goal": "One sentence goal",
  "mitigations": [
    {
      "title": "Mitigation approach",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "effort": "low|med|high",
      "risk_reduction": "low|med|high"
    }
  ],
  "quick_wins": ["Immediate action 1", "Immediate action 2"],
  "dependencies": ["Dependency 1", "Dependency 2"],
  "validation": ["How to verify 1", "How to verify 2"]
}
```

### Effort Ratings

- **low**: Can be done in days with existing resources
- **med**: Requires weeks or moderate budget
- **high**: Months or significant investment

### Risk Reduction Ratings

- **low**: Reduces risk score by <30%
- **med**: Reduces risk score by 30-60%
- **high**: Reduces risk score by >60%

### Prompt Template

```
You are an OT security mitigation planner. Generate a detailed mitigation plan.

**CRITICAL RULES:**
- Only use the provided risk data below
- Do NOT invent technical solutions, vendors, or budget estimates
- If the risk description lacks detail, reflect that in data_gaps
- Be honest about effort/risk_reduction ratings
- Do not assume organizational structure, tools, or existing controls
- Focus on practical, achievable mitigations

**YOUR TASK:**
Generate a JSON object with the exact schema above.

**INPUT DATA:**
{input JSON}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON, no markdown code blocks
- Include 2-5 mitigations (ranked by impact/effort ratio)
- Each mitigation should have 3-6 specific steps
- Include 2-4 quick_wins (doable in 1-7 days)
- List all dependencies honestly (don't assume budget approval)
- Include 2-4 validation methods (measurable outcomes)
- If critical risk details are missing, note in a "note" field

Return only the JSON object.
```

### Example Input

```json
{
  "risk_id": "RISK-042",
  "risk_title": "Legacy PLC vulnerabilities",
  "severity": "major",
  "likelihood": "likely",
  "current_score": 20,
  "target_score": 8,
  "description": "Allen-Bradley PLCs running firmware from 2015 with no update path",
  "budget": 50000,
  "timeline": "6 months",
  "assets_affected": 5
}
```

### Example Output

```json
{
  "goal": "Reduce Legacy PLC vulnerability risk from score 20 to 8 within 6 months and $50K budget",
  "mitigations": [
    {
      "title": "Network micro-segmentation for PLCs",
      "steps": [
        "Map all communication flows to/from the 5 affected PLCs",
        "Deploy industrial firewall rules allowing only required protocols (EtherNet/IP, Modbus)",
        "Block all management protocols (Telnet, FTP) except from designated engineering workstation",
        "Enable logging for all denied connection attempts",
        "Test segmentation with controlled downtime"
      ],
      "effort": "low",
      "risk_reduction": "med"
    },
    {
      "title": "Application whitelisting on engineering workstation",
      "steps": [
        "Identify engineering workstation that connects to PLCs",
        "Deploy application control (e.g., Windows AppLocker or third-party)",
        "Allow only authorized PLC programming software",
        "Block USB mass storage except for approved devices",
        "Monitor for unauthorized software execution attempts"
      ],
      "effort": "low",
      "risk_reduction": "med"
    },
    {
      "title": "PLC replacement planning",
      "steps": [
        "Contact Allen-Bradley for current generation equivalent PLCs",
        "Request quote and lead time for 5 replacement units",
        "Develop migration plan including logic conversion and testing",
        "Schedule replacement during planned maintenance windows",
        "Retain legacy PLCs as cold spares if budget allows"
      ],
      "effort": "high",
      "risk_reduction": "high"
    },
    {
      "title": "Intrusion detection for PLC subnet",
      "steps": [
        "Deploy industrial IDS sensor on PLC network segment",
        "Configure alerts for unauthorized commands, firmware changes, logic downloads",
        "Baseline normal PLC communication patterns over 2 weeks",
        "Tune alerts to reduce false positives",
        "Integrate alerts with SOC or on-call rotation"
      ],
      "effort": "med",
      "risk_reduction": "low"
    }
  ],
  "quick_wins": [
    "Disable Telnet/FTP on PLCs if not required (check vendor documentation first)",
    "Change default PLC passwords to complex passwords stored in password manager",
    "Document authorized personnel allowed to program PLCs",
    "Disable unused PLC network ports if physically accessible"
  ],
  "dependencies": [
    "Network diagram showing PLC connections (for micro-segmentation)",
    "Vendor confirmation on whether disabling protocols affects functionality",
    "Budget approval for firewall, IDS, or replacement PLCs",
    "Planned maintenance windows for testing segmentation",
    "Engineering workstation access for application whitelisting deployment"
  ],
  "validation": [
    "Firewall logs show only approved protocols reaching PLCs",
    "Vulnerability scan confirms Telnet/FTP ports closed",
    "IDS generates alerts during monthly red team test",
    "Engineering workstation blocks unauthorized software in monthly test",
    "Re-assessment shows risk score reduced to target (8 or below)"
  ]
}
```

---

## Prompt Engineering Best Practices

### 1. Anti-Hallucination Techniques

✅ **Explicit instructions**
```
Do NOT invent or assume plant facts, equipment names, or network details
```

✅ **Forced acknowledgment**
```
If data is missing or unclear, explicitly say "unknown" or "data not provided"
```

✅ **Data source emphasis**
```
Based ONLY on provided data, say "unknown" if unclear
```

### 2. Output Structure Enforcement

✅ **Exact format specification**
```
Provide exactly 4-8 concise bullet points
Start each bullet with one of: "Changed:", "Cause:", "Check:", "Escalate if:"
```

✅ **Schema definition** (for JSON)
```json
{
  "field": "Description of what to include",
  "constraints": "Must be one of: value1|value2|value3"
}
```

### 3. Confidence & Uncertainty

✅ **Confidence levels**
```
Use confidence "low" if data is limited, "med" if partial, "high" if comprehensive
```

✅ **Data gaps field**
```
Always include data_gaps array (be honest about missing data)
```

✅ **Assumptions field**
```
Always include assumptions array (even if empty: [])
```

### 4. Tone Calibration

**Signal Assistant**: Operator-friendly, concise, no jargon
```
Be concise and operator-friendly
Each bullet should be 1-2 sentences maximum
```

**Risk Assistant**: Technical but accessible
```
Be specific and actionable
Be specific to the risk type, but don't invent technical details
```

**Executive Summary**: Board-level, strategic
```
Generate a concise executive summary
3-5 sentences covering key points
```

**Mitigation Plan**: Practical, detailed
```
Focus on practical, achievable mitigations
Each mitigation should have 3-6 specific steps
```

---

## Testing Prompts

### Signal Assistant Test

```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "UUID",
    "mode": "chat",
    "use_case": "signal_assistant",
    "input": {
      "signal_type": "unauthorized_access",
      "severity": "high",
      "source": "firewall",
      "attempts": 15
    }
  }'
```

### Risk Assistant Test

```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "UUID",
    "mode": "chat",
    "use_case": "risk_assistant",
    "input": {
      "risk_title": "Unpatched SCADA",
      "current_severity": "major",
      "current_likelihood": "likely",
      "last_patch_date": "2022-01-01"
    }
  }'
```

### Executive Summary Test

```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "UUID",
    "mode": "report",
    "use_case": "exec_summary",
    "input": {
      "period": "Q1 2024",
      "total_risks": 42,
      "critical_risks": 8,
      "patching_coverage": 45
    }
  }'
```

### Mitigation Plan Test

```bash
curl -X POST https://PROJECT.supabase.co/functions/v1/ai_gateway \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "UUID",
    "mode": "report",
    "use_case": "mitigation_plan",
    "input": {
      "risk_title": "Legacy PLCs",
      "severity": "major",
      "likelihood": "likely",
      "budget": 50000,
      "timeline": "6 months"
    }
  }'
```

---

## Maintenance & Evolution

### Monitoring Prompt Quality

1. **Track "unknown" frequency** - If AI says "unknown" too often, input quality may be insufficient
2. **Review data_gaps** - Common gaps indicate what data to add to inputs
3. **Test edge cases** - Empty inputs, minimal data, contradictory data
4. **Validate JSON parsing** - For report mode, monitor structured field population rate

### Prompt Versioning

When updating prompts:
1. Document changes in git commit message
2. Test with representative inputs before deploying
3. Monitor error rates after deployment
4. Keep example inputs/outputs up to date

### Future Enhancements

- [ ] Add few-shot examples to prompts for better formatting
- [ ] Implement prompt templates stored in database (dynamic)
- [ ] Add user feedback loop to improve prompts
- [ ] Support custom prompts per tenant
- [ ] A/B test prompt variations

---

**Last Updated:** December 26, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
