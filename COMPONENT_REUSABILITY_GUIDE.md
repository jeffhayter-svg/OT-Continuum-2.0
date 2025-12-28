# Component Reusability Guide

**Version:** 1.0.0  
**Last Updated:** December 26, 2024  
**Purpose:** Guide for using onboarding components in post-onboarding workflows

---

## 🎯 Overview

The OT Continuum Onboarding flow includes **8 shared reusable components** designed for platform-wide use and **8 onboarding-specific components** that should NOT be reused outside onboarding.

This guide helps developers identify which components to reuse and how to adapt them for different use cases.

---

## ✅ REUSABLE COMPONENTS (Use Anywhere)

### 1. StepHeader

**Reusability:** ✅ **HIGH** - Use anywhere you need an educational info panel

**Original Context:** Onboarding step explanations

**Reuse Examples:**

#### Settings Page
```tsx
<StepHeader
  title="What is Multi-Factor Authentication?"
  description="MFA adds an extra layer of security by requiring two forms of verification when signing in."
>
  <p>
    When enabled, you'll need both your password and a verification code 
    from your authenticator app to sign in.
  </p>
</StepHeader>
```

#### Dashboard Help Panel
```tsx
<StepHeader
  title="Understanding Risk Scores"
  description="OT Continuum calculates risk scores using asset criticality, vulnerability severity, and operational impact."
  variant="info"
/>
```

#### Modal Dialog
```tsx
<Dialog>
  <StepHeader
    title="Why do we need this information?"
    description="Asset firmware versions are critical for CVE matching and vulnerability assessment."
  />
  <FormSection>...</FormSection>
</Dialog>
```

**DO:**
- Use for educational explanations
- Use for context that helps users understand features
- Use for help panels and info dialogs

**DON'T:**
- Use as page headers (use `<h1>` instead)
- Use for critical alerts (use `.alert-error` instead)
- Nest multiple StepHeaders

---

### 2. EmptyState

**Reusability:** ✅ **HIGH** - Use for all no-data states

**Original Context:** No process units, no tags, no assets

**Reuse Examples:**

#### Empty Risk Register
```tsx
<EmptyState
  icon={ShieldCheck}
  title="No active risks detected"
  description="Your systems are operating within normal parameters. Risks will appear here when detected by signal analysis."
  primaryAction={{
    label: "View Historical Risks",
    onClick: () => navigate('/risks/history'),
    testId: "view-historical-risks"
  }}
  secondaryAction={{
    label: "Configure Risk Thresholds",
    onClick: () => navigate('/settings/risks'),
    testId: "configure-risk-thresholds"
  }}
/>
```

#### Empty Search Results
```tsx
<EmptyState
  icon={Search}
  title="No assets found"
  description={`No assets match "${searchQuery}". Try adjusting your search criteria.`}
  primaryAction={{
    label: "Clear Search",
    onClick: clearSearch,
    testId: "clear-search"
  }}
/>
```

#### Empty Asset Inventory
```tsx
<EmptyState
  icon={Package}
  title="No assets configured"
  description="Import your OT asset inventory to begin monitoring."
  primaryAction={{
    label: "Import Assets",
    onClick: () => setShowImportDialog(true),
    testId: "import-assets"
  }}
/>
```

#### Empty Notification Center
```tsx
<EmptyState
  icon={Bell}
  title="You're all caught up"
  description="No new notifications. Check back later for system alerts and updates."
/>
```

**DO:**
- Use for empty tables/lists
- Use for empty search results
- Use for "zero state" first-run experiences
- Provide actionable next steps

**DON'T:**
- Use for loading states (use skeleton instead)
- Use for error states (use `.alert-error` instead)
- Overload with too many actions (max 2)

---

### 3. DataTable

**Reusability:** ✅ **HIGH** - Use for all tabular data

**Original Context:** Process units table, plant tags table

**Reuse Examples:**

#### Risk Register Table
```tsx
<DataTable
  columns={[
    { 
      key: 'risk_id', 
      label: 'Risk ID', 
      width: '10%',
      render: (value) => <code>{value}</code>
    },
    { 
      key: 'severity', 
      label: 'Severity', 
      width: '10%',
      render: (value) => (
        <span className={`badge-${value === 'High' ? 'error' : 'warning'}`}>
          {value}
        </span>
      )
    },
    { key: 'asset_name', label: 'Asset', width: '20%' },
    { key: 'description', label: 'Description', width: '40%' },
    { 
      key: 'status', 
      label: 'Status', 
      width: '10%',
      render: (value) => (
        <span className={`badge-${value === 'Active' ? 'error' : 'success'}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Detected', 
      width: '10%',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ]}
  data={risks}
  onRowClick={(risk) => navigate(`/risks/${risk.risk_id}`)}
  selectable={true}
  selectedRows={selectedRiskIds}
  onSelectionChange={setSelectedRiskIds}
  testIdPrefix="risk-register"
  emptyMessage="No risks detected"
/>
```

#### Asset Inventory Table
```tsx
<DataTable
  columns={[
    { key: 'asset_name', label: 'Asset Name', width: '20%' },
    { key: 'asset_type', label: 'Type', width: '15%' },
    { key: 'vendor', label: 'Vendor', width: '15%' },
    { key: 'model', label: 'Model', width: '15%' },
    { key: 'ip_address', label: 'IP Address', width: '15%' },
    { 
      key: 'firmware_version', 
      label: 'Firmware', 
      width: '15%',
      render: (value, row) => (
        <div>
          {value || <em className="text-gray-500">Unknown</em>}
          {row.has_vulnerabilities && (
            <AlertTriangle className="w-3 h-3 text-red-500 inline ml-2" />
          )}
        </div>
      )
    }
  ]}
  data={assets}
  onRowClick={(asset) => navigate(`/assets/${asset.ot_asset_id}`)}
  onDelete={(asset) => handleDeleteAsset(asset.ot_asset_id)}
  testIdPrefix="asset-inventory"
/>
```

#### User Management Table
```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', width: '25%' },
    { key: 'email', label: 'Email', width: '30%' },
    { 
      key: 'role', 
      label: 'Role', 
      width: '20%',
      render: (value) => (
        <span className="badge-neutral">{value}</span>
      )
    },
    { 
      key: 'last_login', 
      label: 'Last Login', 
      width: '25%',
      render: (value) => value ? new Date(value).toLocaleString() : 'Never'
    }
  ]}
  data={users}
  onRowClick={(user) => setEditingUser(user)}
  testIdPrefix="user-management"
/>
```

**DO:**
- Use for displaying lists of structured data
- Provide custom `render` functions for complex cells
- Use `onRowClick` for navigation to detail views
- Use `selectable` for bulk actions
- Use `onDelete` for inline deletion

**DON'T:**
- Use for single-row displays (use cards instead)
- Overload with too many columns (max 6-7)
- Put complex interactive elements in cells (keep simple)

---

### 4. AiAssistButton

**Reusability:** ✅ **HIGH** - Use for all AI features

**Original Context:** Tag nomenclature cleanup

**Reuse Examples:**

#### Risk Correlation Analysis
```tsx
<AiAssistButton
  label="Analyze Risk Correlation"
  onClick={handleRiskCorrelation}
  analysisType="Risk Correlation Analysis"
  scope={[
    'Analyzes 47 active risks across 5 process units',
    'Identifies common root causes and attack paths',
    'Suggests preventive actions based on patterns',
    'Uses historical incident data for predictions'
  ]}
  testId="analyze-risk-correlation"
/>
```

#### Asset Vulnerability Scan
```tsx
<AiAssistButton
  label="Scan for Vulnerabilities"
  onClick={handleVulnerabilityScan}
  analysisType="Vulnerability Assessment"
  scope={[
    'Scans 156 OT assets for known CVEs',
    'Matches firmware versions against vulnerability databases',
    'Calculates exploitability scores',
    'Prioritizes by asset criticality'
  ]}
  loading={scanning}
  testId="scan-vulnerabilities"
/>
```

#### Signal Anomaly Detection
```tsx
<AiAssistButton
  label="Detect Anomalies"
  onClick={handleAnomalyDetection}
  analysisType="Anomaly Detection Analysis"
  scope={[
    'Analyzes 2,847 signals over last 7 days',
    'Applies statistical deviation models',
    'Identifies unusual patterns and outliers',
    'Suggests threshold adjustments'
  ]}
  testId="detect-anomalies"
/>
```

#### Work Order Prioritization
```tsx
<AiAssistButton
  label="Suggest Priorities"
  onClick={handleWorkOrderPrioritization}
  analysisType="Work Order Prioritization"
  scope={[
    'Reviews 23 open work orders',
    'Considers risk severity, asset criticality, dependencies',
    'Suggests optimal sequencing',
    'Estimates resource requirements'
  ]}
  testId="prioritize-work-orders"
/>
```

**DO:**
- Use for any AI-powered feature
- Provide specific `analysisType` (shown in confirmation)
- List concrete `scope` items (what will be analyzed)
- Always require confirmation (default)
- Handle loading states

**DON'T:**
- Use for non-AI features (misleading)
- Be vague ("AI Magic" ❌)
- Skip confirmation for destructive actions
- Use playful language (see AI Brand Voice Guidelines)

---

### 5. AiSuggestionsPanel

**Reusability:** ✅ **HIGH** - Use for displaying AI results

**Original Context:** Tag description suggestions

**Reuse Examples:**

#### Risk Correlation Results
```tsx
<AiSuggestionsPanel
  title="Risk Correlation Findings (Pattern-Based)"
  description="Analysis of 47 active risks identified 3 correlation clusters. Review findings below and investigate common root causes."
  suggestions={[
    {
      id: '1',
      field: 'Cluster 1: Network Segmentation',
      original: null,
      suggested: '12 risks linked to inadequate network segmentation between OT and IT',
      confidence: 0.92,
      basis: 'Common network topology pattern'
    },
    {
      id: '2',
      field: 'Cluster 2: Legacy Firmware',
      original: null,
      suggested: '8 risks linked to outdated firmware on Siemens PLCs',
      confidence: 0.88,
      basis: 'CVE-2023-1234 affects all instances'
    }
  ]}
  onApply={() => {
    // Create work orders from clusters
    handleCreateWorkOrders(correlationClusters);
  }}
  onCancel={() => setShowCorrelations(false)}
/>
```

#### Vulnerability Remediation Suggestions
```tsx
<AiSuggestionsPanel
  title="Vulnerability Remediation Plan"
  description="Based on vulnerability scan, 23 assets require firmware updates. Recommendations prioritized by risk severity and operational impact."
  suggestions={vulnerabilitySuggestions}
  onApply={handleScheduleRemediation}
  onCancel={handleCancelRemediation}
/>
```

**DO:**
- Show confidence scores as "Pattern Match"
- Explain the analysis basis
- Allow individual review before applying
- Provide technical explanations

**DON'T:**
- Auto-apply without user confirmation
- Use vague language ("AI thinks..." ❌)
- Hide confidence scores
- Skip verification warnings

---

### 6. FormSection

**Reusability:** ✅ **HIGH** - Use for all forms

**Original Context:** Onboarding input forms

**Reuse Examples:**

#### User Profile Editing
```tsx
<FormSection
  title="Personal Information"
  description="Update your profile details"
>
  <FormField label="Name" required>
    <FormInput 
      value={name} 
      onChange={(e) => setName(e.target.value)} 
    />
  </FormField>
  
  <FormField label="Email" required hint="Your work email address">
    <FormInput 
      type="email"
      value={email} 
      onChange={(e) => setEmail(e.target.value)} 
    />
  </FormField>
  
  <FormField label="Phone" hint="Include country code">
    <FormInput 
      type="tel"
      value={phone} 
      onChange={(e) => setPhone(e.target.value)} 
    />
  </FormField>
</FormSection>

<FormSection
  title="Notification Preferences"
  variant="highlighted"
>
  <FormField label="Risk Alerts">
    <FormSelect 
      value={riskAlertFreq} 
      onChange={setRiskAlertFreq}
      options={[
        { value: 'immediate', label: 'Immediate' },
        { value: 'daily', label: 'Daily Digest' },
        { value: 'never', label: 'Never' }
      ]}
    />
  </FormField>
</FormSection>
```

#### Asset Editing
```tsx
<FormSection title="Asset Details">
  <FormField label="Asset Name" required>
    <FormInput value={assetName} onChange={setAssetName} />
  </FormField>
  
  <FormField label="IP Address" hint="IPv4 format (e.g., 10.1.1.100)">
    <FormInput 
      value={ipAddress} 
      onChange={setIpAddress}
      error={!isValidIp(ipAddress)}
    />
  </FormField>
</FormSection>
```

**DO:**
- Group related fields
- Use descriptive titles
- Provide helpful hints
- Use `variant="highlighted"` for important sections

**DON'T:**
- Create overly large sections (max 5-7 fields)
- Nest FormSections inside FormSections
- Skip labels (always label inputs)

---

### 7. BulkMappingTable

**Reusability:** ✅ **HIGH** - Use for many-to-many relationships

**Original Context:** Assets ↔ Process Units, Assets ↔ Plant Systems

**Reuse Examples:**

#### User Role Assignment
```tsx
<BulkMappingTable
  rows={users}
  columns={roles}
  rowKey="user_id"
  columnKey="role_id"
  rowLabelKey="name"
  columnLabelKey="role_name"
  existingMappings={currentUserRoles}
  onChange={handleRoleAssignments}
  testIdPrefix="user-role-mapping"
/>
```

#### Asset Access Control
```tsx
<BulkMappingTable
  rows={assets}
  columns={userGroups}
  rowKey="asset_id"
  columnKey="group_id"
  rowLabelKey="asset_name"
  columnLabelKey="group_name"
  existingMappings={assetPermissions}
  onChange={handleAccessControl}
  testIdPrefix="asset-access"
/>
```

#### Tag Reassignment
```tsx
<BulkMappingTable
  rows={plantTags}
  columns={processUnits}
  rowKey="plant_tag_id"
  columnKey="process_unit_id"
  rowLabelKey="tag_name"
  columnLabelKey="unit_name"
  existingMappings={currentTagAssignments}
  onChange={handleTagReassignments}
  testIdPrefix="tag-reassignment"
/>
```

**DO:**
- Use for any many-to-many relationship
- Provide "Select All" column headers
- Support keyboard navigation
- Show existing mappings clearly

**DON'T:**
- Use for one-to-many (use dropdown instead)
- Create tables with >20 columns (unreadable)
- Skip validation (check business rules before saving)

---

### 8. ProgressIndicator

**Reusability:** ⚠️ **MEDIUM** - Use for multi-step processes

**Original Context:** 7-step onboarding flow

**Reuse Examples:**

#### Configuration Wizard
```tsx
<ProgressIndicator
  steps={[
    { id: 'basic', label: 'Basic Settings', completed: true },
    { id: 'network', label: 'Network Config', completed: true },
    { id: 'alerts', label: 'Alert Rules', completed: false },
    { id: 'review', label: 'Review', completed: false }
  ]}
  currentStep={2}
  variant="horizontal"
/>
```

#### Multi-Step Form
```tsx
<ProgressIndicator
  steps={importSteps}
  currentStep={currentImportStep}
  variant="vertical"
/>
```

**DO:**
- Use for 3-7 step processes
- Show completed steps clearly
- Indicate current step prominently

**DON'T:**
- Use for single-step processes
- Use for >10 steps (too cluttered)
- Make steps clickable (linear flow only)

---

## ❌ NON-REUSABLE COMPONENTS (Onboarding-Only)

### DO NOT Use Outside Onboarding:

1. **CreateSiteStep** - Tightly coupled to site creation flow
2. **ProcessUnitsStep** - Onboarding-specific validation
3. **PlantTagsStep** - Onboarding-specific CSV import
4. **AssetLedgerStep** - Onboarding-specific validation
5. **MapPlantSystemsStep** - Onboarding-specific flow
6. **MapProcessUnitsStep** - Onboarding-specific flow
7. **MapPlantTagsStep** - Onboarding-specific flow
8. **CompletionStep** - Onboarding-specific summary

### If You Need Similar Functionality:

**Instead of reusing onboarding-specific components, extract the pattern:**

#### Example: CSV Import Pattern

**DON'T:**
```tsx
// ❌ Don't import onboarding-specific component
import { PlantTagsStep } from './onboarding/PlantTagsStep';

// ❌ Don't try to use it elsewhere
<PlantTagsStep siteId={siteId} onComplete={...} />
```

**DO:**
```tsx
// ✅ Create a generic CSV import component
import { CsvImportDialog } from './shared/CsvImportDialog';

<CsvImportDialog
  title="Import Assets"
  templateUrl="/templates/assets-template.csv"
  columns={['asset_name', 'vendor', 'model', 'ip_address']}
  onImport={handleAssetImport}
  onCancel={handleCancelImport}
/>
```

---

## 🎨 DESIGN PATTERNS TO EXTRACT

### Pattern 1: CSV Import + AI Cleanup

**Used in:** PlantTagsStep, AssetLedgerStep

**Reusable Pattern:**
1. Upload method selection (CSV vs Manual)
2. CSV file input with template download
3. Preview imported data in table
4. AI cleanup button (optional)
5. AI suggestions panel
6. Save and continue

**Create Generic Component:**
```tsx
<CsvImportWizard
  entity="assets"
  templateColumns={['name', 'type', 'vendor', 'model']}
  aiCleanupEnabled={true}
  aiAnalysisType="Asset Data Cleanup"
  onComplete={handleImportComplete}
/>
```

---

### Pattern 2: Bulk Checkbox Mapping

**Used in:** MapPlantSystemsStep, MapProcessUnitsStep, MapPlantTagsStep

**Reusable Pattern:**
1. Checkbox matrix (rows x columns)
2. Select all column headers
3. Visual indication of existing mappings
4. Save mappings / Skip option

**Already Extracted:** `BulkMappingTable` component ✅

---

### Pattern 3: Multi-Step Wizard with Progress

**Used in:** Entire onboarding flow

**Reusable Pattern:**
1. Progress indicator at top
2. Step content area
3. Step footer with actions
4. Linear navigation (no skipping forward)

**Create Generic Component:**
```tsx
<Wizard
  steps={wizardSteps}
  currentStep={currentStep}
  onStepComplete={handleStepComplete}
  onCancel={handleCancel}
/>
```

---

### Pattern 4: Empty State → Data Entry → Table View

**Used in:** ProcessUnitsStep, PlantTagsStep, AssetLedgerStep

**Reusable Pattern:**
1. Empty state with "Get Started" action
2. Data entry form (manual or CSV)
3. Data table showing added items
4. Add more / Delete options
5. Save and continue

**Generic Implementation:**
```tsx
<DataEntryFlow
  entityName="risks"
  emptyStateIcon={AlertTriangle}
  emptyStateTitle="No risks configured"
  emptyStateDescription="Add risks manually or import from CSV"
  fields={riskFields}
  onSave={handleSaveRisks}
/>
```

---

## 🚀 MIGRATION GUIDE: Onboarding → Post-Onboarding

### Scenario: Asset Editing After Onboarding

**Onboarding:** Assets created in bulk during AssetLedgerStep  
**Post-Onboarding:** Edit individual asset details

**Reuse these components:**
```tsx
// Asset editing page
function AssetEditPage({ assetId }: { assetId: string }) {
  const [asset, setAsset] = useState<Asset | null>(null);
  
  return (
    <div>
      <h1>Edit Asset: {asset?.asset_name}</h1>
      
      {/* Reuse FormSection */}
      <FormSection title="Asset Details">
        <FormField label="Asset Name" required>
          <FormInput 
            value={asset?.asset_name} 
            onChange={handleNameChange} 
          />
        </FormField>
        
        <FormField label="IP Address">
          <FormInput 
            value={asset?.ip_address} 
            onChange={handleIpChange} 
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Firmware Information">
        <FormField label="Current Version">
          <FormInput 
            value={asset?.firmware_version} 
            onChange={handleFirmwareChange} 
          />
        </FormField>
      </FormSection>
      
      {/* Standard action buttons (NOT StepFooter) */}
      <div className="flex gap-3 mt-6">
        <button className="btn-primary" onClick={handleSave}>
          Save Changes
        </button>
        <button className="btn-secondary" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

**DON'T reuse:**
- AssetLedgerStep (onboarding-specific)
- StepFooter (wizard-specific)
- ProgressIndicator (multi-step specific)

---

### Scenario: Tag Reassignment After Onboarding

**Onboarding:** Tags created and assigned to process units  
**Post-Onboarding:** Reassign tags to different process units

**Reuse BulkMappingTable:**
```tsx
function TagReassignmentPage() {
  const [tags, setTags] = useState<PlantTag[]>([]);
  const [processUnits, setProcessUnits] = useState<ProcessUnit[]>([]);
  const [mappings, setMappings] = useState<Set<string>>(new Set());
  
  return (
    <div>
      <h1>Reassign Plant Tags</h1>
      
      {/* Reuse StepHeader for explanation */}
      <StepHeader
        title="Tag Reassignment"
        description="Assign tags to different process units. Tags can only belong to one process unit at a time."
      />
      
      {/* Reuse BulkMappingTable */}
      <BulkMappingTable
        rows={tags}
        columns={processUnits}
        rowKey="plant_tag_id"
        columnKey="process_unit_id"
        rowLabelKey="tag_name"
        columnLabelKey="unit_name"
        existingMappings={mappings}
        onChange={setMappings}
        testIdPrefix="tag-reassignment"
      />
      
      <div className="flex gap-3 mt-6">
        <button className="btn-primary" onClick={handleSaveMappings}>
          Save Assignments
        </button>
        <button className="btn-secondary" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

### Scenario: AI-Assisted Risk Analysis

**Onboarding:** AI tag nomenclature cleanup  
**Post-Onboarding:** AI risk correlation analysis

**Reuse AI components:**
```tsx
function RiskAnalysisPage() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [correlations, setCorrelations] = useState([]);
  
  const handleAnalyze = async () => {
    // Call AI Gateway
    const results = await analyzeRiskCorrelations();
    setCorrelations(results);
    setShowSuggestions(true);
  };
  
  return (
    <div>
      <h1>Risk Register</h1>
      
      {/* Reuse DataTable for risks */}
      <DataTable
        columns={riskColumns}
        data={risks}
        testIdPrefix="risk-register"
      />
      
      {/* Reuse AiAssistButton */}
      <AiAssistButton
        label="Analyze Risk Correlation"
        onClick={handleAnalyze}
        analysisType="Risk Correlation Analysis"
        scope={[
          'Analyzes 47 active risks',
          'Identifies common root causes',
          'Suggests preventive actions'
        ]}
      />
      
      {/* Reuse AiSuggestionsPanel */}
      {showSuggestions && (
        <AiSuggestionsPanel
          title="Risk Correlation Findings"
          description="Pattern analysis identified 3 correlation clusters..."
          suggestions={correlations}
          onApply={handleApplyCorrelations}
          onCancel={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}
```

---

## ✅ REUSABILITY CHECKLIST

Before reusing a component, check:

**Component Evaluation:**
- [ ] Component is in `/components/onboarding/shared/` directory
- [ ] Component is marked as HIGH or MEDIUM reusability
- [ ] Component props are generic (not onboarding-specific)
- [ ] Component has clear API documentation

**Implementation Checklist:**
- [ ] Import from correct path (`./components/onboarding/shared/...`)
- [ ] Pass all required props
- [ ] Provide unique `testId` for new context
- [ ] Use design tokens (don't override colors/spacing)
- [ ] Follow AI Brand Voice Guidelines (if AI component)

**Testing Checklist:**
- [ ] Component renders correctly in new context
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Test IDs are unique and descriptive
- [ ] Error states handled properly

---

## 📚 FURTHER READING

- [Design Token System](/DESIGN_TOKEN_SYSTEM.md)
- [AI Brand Voice Guidelines](/AI_BRAND_VOICE_GUIDELINES.md)
- [Onboarding v1 Design Freeze](/ONBOARDING_V1_DESIGN_FREEZE.md)
- [Normalized Components Catalog](/NORMALIZED_COMPONENTS_CATALOG.md)

---

**Remember: Shared components are designed for reuse, but onboarding-specific components should stay in onboarding. Extract patterns, don't copy components.**
