import React, { useState } from 'react';
import { Save, Plus, Upload, ArrowRight } from 'lucide-react';
import { FoundationModeBanner } from '../components/onboarding/FoundationModeBanner';
import { 
  FoundationModeButton, 
  StepIndicator,
  FormSection,
  FormField,
  FormInput,
  DataTable
} from '../components/onboarding/shared';

/**
 * Foundation Mode Demo
 * 
 * Demonstrates all Foundation Mode UI states:
 * - Global banner
 * - Disabled buttons with tooltips
 * - Read-only step indicators
 * - Form fields (read-only visual state)
 * 
 * Purpose: Show "intentionally disabled" not "broken"
 */
export function FoundationModeDemo() {
  const [foundationMode, setFoundationMode] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'step-1', title: 'Configure Settings', required: true, completed: false },
    { id: 'step-2', title: 'Upload Data', required: true, completed: false },
    { id: 'step-3', title: 'Review & Confirm', required: true, completed: false },
  ];

  const sampleData = [
    { id: '1', name: 'Process Unit A', code: 'PU-001', status: 'Active' },
    { id: '2', name: 'Process Unit B', code: 'PU-002', status: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-app">
      {/* Foundation Mode Banner */}
      {foundationMode && (
        <FoundationModeBanner showDetails={true} />
      )}

      {/* Demo Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="card-ot mb-6">
          <h2 className="mb-4">Foundation Mode Demo Controls</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox-ot"
                checked={foundationMode}
                onChange={(e) => setFoundationMode(e.target.checked)}
              />
              <span className="text-sm text-primary">
                Foundation Mode Active
              </span>
            </label>
            <span className="text-xs text-tertiary">
              Toggle to see enabled/disabled states
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Step Indicators */}
          <div className="col-span-3">
            <div className="card-ot">
              <h3 className="mb-4 text-xs text-tertiary uppercase tracking-wide">
                Steps
              </h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <StepIndicator
                    key={step.id}
                    title={step.title}
                    stepNumber={index + 1}
                    totalSteps={steps.length}
                    isCurrent={currentStep === index}
                    isCompleted={step.completed}
                    isRequired={step.required}
                    foundationMode={foundationMode}
                    onClick={() => !foundationMode && setCurrentStep(index)}
                    testId={`step-indicator-${step.id}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="card-ot-lg space-y-6">
              <div>
                <h2 className="mb-2">Foundation Mode Components</h2>
                <p className="text-sm text-secondary">
                  All components below demonstrate Foundation Mode visual states
                </p>
              </div>

              {/* Section 1: Buttons */}
              <FormSection title="1. Primary Action Buttons">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-secondary mb-3">
                      Primary actions with Foundation Mode tooltips:
                    </p>
                    <div className="flex gap-3">
                      <FoundationModeButton
                        label="Save & Continue"
                        onClick={() => alert('Saved!')}
                        foundationMode={foundationMode}
                        variant="primary"
                        icon={<Save className="w-5 h-5" />}
                        testId="save-button"
                      />
                      <FoundationModeButton
                        label="Add New"
                        onClick={() => alert('Added!')}
                        foundationMode={foundationMode}
                        variant="secondary"
                        icon={<Plus className="w-5 h-5" />}
                        testId="add-button"
                      />
                      <FoundationModeButton
                        label="Upload File"
                        onClick={() => alert('Uploaded!')}
                        foundationMode={foundationMode}
                        variant="success"
                        icon={<Upload className="w-5 h-5" />}
                        testId="upload-button"
                      />
                    </div>
                  </div>

                  <div className="divider-ot" />

                  <div>
                    <p className="text-sm text-secondary mb-3">
                      Hover over disabled buttons to see tooltips explaining why they're unavailable.
                    </p>
                  </div>
                </div>
              </FormSection>

              {/* Section 2: Form Fields */}
              <FormSection title="2. Form Input Fields">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Site Name"
                    required
                    hint={foundationMode ? "Read-only in Foundation Mode" : "Enter your site name"}
                  >
                    <FormInput
                      type="text"
                      value="Refinery Alpha"
                      disabled={foundationMode}
                      placeholder="e.g., Refinery Alpha"
                      data-testid="site-name-input"
                    />
                  </FormField>

                  <FormField
                    label="Site Code"
                    required
                    hint={foundationMode ? "Read-only in Foundation Mode" : "Short identifier"}
                  >
                    <FormInput
                      type="text"
                      value="RAF-01"
                      disabled={foundationMode}
                      placeholder="e.g., RAF-01"
                      data-testid="site-code-input"
                    />
                  </FormField>
                </div>

                {foundationMode && (
                  <div className="alert-warning mt-4 flex items-start gap-3">
                    <p className="text-sm">
                      <strong>Foundation Mode:</strong> Form fields are read-only. 
                      You can review the interface but cannot save changes.
                    </p>
                  </div>
                )}
              </FormSection>

              {/* Section 3: Data Tables */}
              <FormSection title="3. Data Tables (Read-Only)">
                <DataTable
                  columns={[
                    { key: 'code', header: 'Unit Code', width: '120px' },
                    { key: 'name', header: 'Name' },
                    { key: 'status', header: 'Status', width: '100px' },
                  ]}
                  data={sampleData}
                />
                
                {foundationMode && (
                  <div className="mt-4 text-sm text-tertiary">
                    ℹ️ Table interactions are disabled in Foundation Mode
                  </div>
                )}
              </FormSection>

              {/* Section 4: Action Footer */}
              <div className="pt-6 border-t border-default">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-secondary">
                    {foundationMode ? (
                      <span className="badge-processing">Foundation Mode Active</span>
                    ) : (
                      <span className="badge-success">Ready to Save</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <FoundationModeButton
                      label="Continue to Next Step"
                      onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length - 1))}
                      foundationMode={foundationMode}
                      variant="primary"
                      icon={<ArrowRight className="w-5 h-5" />}
                      testId="continue-button"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoundationModeDemo;
