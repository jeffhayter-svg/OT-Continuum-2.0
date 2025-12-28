import React, { useState } from 'react';
import { 
  AiAssistButton, 
  AiSuggestionsPanel,
  AiInlineSuggestion 
} from '../components/onboarding/shared';

/**
 * AI Assistance Demo
 * 
 * Demonstrates all AI assistance components styled for decision support:
 * - AiAssistButton (trigger analysis)
 * - AiSuggestionsPanel (bulk review)
 * - AiInlineSuggestion (single suggestion)
 * 
 * Design Philosophy:
 * - Advisory, not authoritative
 * - Info blue color (distinct from primary yellow)
 * - Clear "AI-Suggested" labeling
 * - Verification warnings prominent
 * - Human approval required
 */
export function AiAssistanceDemo() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inlineSuggestions, setInlineSuggestions] = useState([
    { id: '1', field: 'process_unit_type', original: 'dist', suggested: 'Distillation Column', confidence: 0.95 },
    { id: '2', field: 'equipment_tag', original: 'PU-01', suggested: 'PU-001-DIST', confidence: 0.87 },
  ]);

  const bulkSuggestions = [
    {
      id: '1',
      field: 'process_unit_name',
      original: 'pu1',
      suggested: 'Distillation Unit 1',
      confidence: 0.95,
      basis: 'Based on nomenclature pattern: [unit type] + [number]'
    },
    {
      id: '2',
      field: 'process_unit_type',
      original: 'dist',
      suggested: 'Distillation Column',
      confidence: 0.92,
      basis: 'Common abbreviation expansion'
    },
    {
      id: '3',
      field: 'equipment_tag',
      original: 'PU-01',
      suggested: 'PU-001-DIST',
      confidence: 0.87,
      basis: 'ISA-88 compliant tag structure'
    },
    {
      id: '4',
      field: 'location',
      original: 'bldg2',
      suggested: 'Building 2 - Process Area',
      confidence: 0.78,
      basis: 'Location normalization'
    },
    {
      id: '5',
      field: 'criticality',
      original: 'hi',
      suggested: 'High',
      confidence: 0.65,
      basis: 'Abbreviation expansion (low confidence)'
    },
  ];

  const handleAiAnalysis = async () => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowSuggestions(true);
  };

  const handleApplySuggestions = () => {
    alert('Suggestions applied! In a real app, these would update your data.');
    setShowSuggestions(false);
  };

  const handleAcceptInline = (id: string) => {
    setInlineSuggestions(prev => prev.filter(s => s.id !== id));
    alert(`Accepted suggestion: ${id}`);
  };

  const handleRejectInline = (id: string) => {
    setInlineSuggestions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="mb-2">AI Assistance Components</h1>
          <p className="text-sm text-secondary">
            Styled for decision support in regulated OT environments
          </p>
        </div>

        {/* Design Principles Card */}
        <div className="card-ot mb-6">
          <h2 className="mb-4">Design Principles</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="badge-ai">Advisory</span>
              <div className="text-sm text-secondary">
                <strong className="text-primary">Not Authoritative:</strong> AI suggestions are recommendations, not commands. 
                Human operators maintain full control over all decisions.
              </div>
            </div>
            
            <div className="divider-ot" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm mb-2">Visual Distinction</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• Info blue color (#44CCFF)</li>
                  <li>• Never uses primary yellow</li>
                  <li>• Clear "AI-Suggested" badges</li>
                  <li>• Lighter visual weight</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm mb-2">Human Control</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• Confirmation dialogs required</li>
                  <li>• Verification warnings prominent</li>
                  <li>• Easy accept/reject actions</li>
                  <li>• Changes are reversible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: AI Assist Button */}
        <div className="card-ot-lg mb-6">
          <h2 className="mb-4">1. AI Assist Button</h2>
          <p className="text-sm text-secondary mb-4">
            Triggers AI analysis with confirmation dialog. Uses info blue color to distinguish from primary actions.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="label-ot">Trigger AI Analysis</label>
              <div className="flex gap-3">
                <AiAssistButton
                  label="Analyze & Suggest"
                  onClick={handleAiAnalysis}
                  testId="demo-ai-button"
                  analysisType="Tag Cleanup Analysis"
                  scope={['Process units', 'Equipment tags', 'Location names']}
                  requiresConfirmation={true}
                />
                
                <button className="btn-primary">
                  Compare: Primary Button
                </button>
              </div>
            </div>
            
            <div className="alert-info">
              <div className="text-sm">
                <strong>Notice:</strong> Click the AI button to see the confirmation dialog explaining:
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>What the AI will analyze</li>
                  <li>That suggestions require approval</li>
                  <li>No automatic changes will be made</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Bulk Suggestions Panel */}
        {showSuggestions && (
          <div className="mb-6">
            <AiSuggestionsPanel
              suggestions={bulkSuggestions}
              onApply={handleApplySuggestions}
              onCancel={() => setShowSuggestions(false)}
              title="AI-Generated Tag Cleanup Suggestions"
              description="Review these AI-generated suggestions. All recommendations require your verification before applying."
            />
          </div>
        )}

        {/* Section 3: Inline Suggestions */}
        {inlineSuggestions.length > 0 && (
          <div className="card-ot-lg mb-6">
            <h2 className="mb-4">2. Inline AI Suggestions</h2>
            <p className="text-sm text-secondary mb-4">
              Compact suggestions for individual fields. Easy to accept or reject without disrupting workflow.
            </p>
            
            <div className="space-y-3">
              {inlineSuggestions.map(suggestion => (
                <AiInlineSuggestion
                  key={suggestion.id}
                  field={suggestion.field}
                  original={suggestion.original}
                  suggested={suggestion.suggested}
                  confidence={suggestion.confidence}
                  basis="Pattern matching based on site nomenclature"
                  onAccept={() => handleAcceptInline(suggestion.id)}
                  onReject={() => handleRejectInline(suggestion.id)}
                  testId={`inline-suggestion-${suggestion.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Color Reference */}
        <div className="card-ot-lg mb-6">
          <h2 className="mb-4">3. Color Palette</h2>
          <p className="text-sm text-secondary mb-4">
            AI elements use info blue to visually distinguish them from authoritative actions.
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-tertiary mb-2">PRIMARY (Authoritative)</div>
              <div 
                className="h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <span style={{ color: '#000000' }}>Yellow #FFCC00</span>
              </div>
              <div className="text-xs text-secondary mt-2">
                Used for: Save, Confirm, Primary CTAs
              </div>
            </div>
            
            <div>
              <div className="text-xs text-tertiary mb-2">AI ASSIST (Advisory)</div>
              <div 
                className="h-16 rounded-lg flex items-center justify-center border"
                style={{ 
                  backgroundColor: 'rgba(68, 204, 255, 0.1)',
                  borderColor: 'var(--color-info)'
                }}
              >
                <span style={{ color: 'var(--color-info)' }}>Blue #44CCFF</span>
              </div>
              <div className="text-xs text-secondary mt-2">
                Used for: AI suggestions, recommendations
              </div>
            </div>
            
            <div>
              <div className="text-xs text-tertiary mb-2">SUCCESS (Confirmation)</div>
              <div 
                className="h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                <span style={{ color: '#000000' }}>Green #44FF44</span>
              </div>
              <div className="text-xs text-secondary mt-2">
                Used for: High confidence indicators
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Best Practices */}
        <div className="card-ot-lg">
          <h2 className="mb-4">4. Best Practices for Regulated Environments</h2>
          
          <div className="space-y-4">
            <div className="alert-warning">
              <div className="text-sm">
                <strong>Regulatory Compliance:</strong> AI-assisted features must maintain clear human oversight 
                and traceability for compliance with OT safety standards.
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm mb-2 text-success">✓ DO</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• Label clearly as "AI-Suggested"</li>
                  <li>• Require human verification</li>
                  <li>• Use info blue (non-authoritative)</li>
                  <li>• Show confidence levels</li>
                  <li>• Provide basis/reasoning</li>
                  <li>• Make changes reversible</li>
                  <li>• Log AI-assisted decisions</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm mb-2 text-danger">✗ DON'T</h3>
                <ul className="text-sm text-secondary space-y-1">
                  <li>• Use primary yellow for AI</li>
                  <li>• Auto-apply without approval</li>
                  <li>• Hide that AI was involved</li>
                  <li>• Present as authoritative</li>
                  <li>• Skip verification warnings</li>
                  <li>• Make irreversible changes</li>
                  <li>• Bypass human oversight</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAssistanceDemo;
