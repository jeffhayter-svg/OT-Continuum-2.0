import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, AlertCircle } from 'lucide-react';
import { CreateSiteStep } from '../components/onboarding/CreateSiteStep';
import { ProcessUnitsStep } from '../components/onboarding/ProcessUnitsStep';
import { PlantTagsStep } from '../components/onboarding/PlantTagsStep';
import { AssetLedgerStep } from '../components/onboarding/AssetLedgerStep';
import { MapPlantSystemsStep } from '../components/onboarding/MapPlantSystemsStep';
import { MapProcessUnitsStep } from '../components/onboarding/MapProcessUnitsStep';
import { MapPlantTagsStep } from '../components/onboarding/MapPlantTagsStep';
import { CompletionStep } from '../components/onboarding/CompletionStep';
import otContinuumLogo from 'figma:asset/298496903f3211cc578283efa0c2ca69fb76038f.png';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  component: React.ComponentType<any>;
}

interface SiteOnboardingProps {
  siteId: string;
  siteName: string;
  onComplete: () => void;
}

export function SiteOnboarding({ siteId, siteName, onComplete }: SiteOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'process-units',
      title: 'Create Process Units',
      description: 'Define functional production units for this site',
      completed: false,
      required: true,
      component: ProcessUnitsStep,
    },
    {
      id: 'plant-tags',
      title: 'Add Plant Tags',
      description: 'Add instrumentation tags for each process unit',
      completed: false,
      required: true,
      component: PlantTagsStep,
    },
    {
      id: 'asset-ledger',
      title: 'Upload OT Asset Ledger',
      description: 'Import your OT asset inventory',
      completed: false,
      required: true,
      component: AssetLedgerStep,
    },
    {
      id: 'map-systems',
      title: 'Map Assets to Plant Systems',
      description: 'Assign assets to plant systems (many-to-many)',
      completed: false,
      required: false,
      component: MapPlantSystemsStep,
    },
    {
      id: 'map-process-units',
      title: 'Map Assets to Process Units',
      description: 'Assign assets to process units (many-to-many)',
      completed: false,
      required: true,
      component: MapProcessUnitsStep,
    },
    {
      id: 'map-tags',
      title: 'Map Assets to Plant Tags (Optional)',
      description: 'Associate assets with specific tags',
      completed: false,
      required: false,
      component: MapPlantTagsStep,
    },
  ]);

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData?.component;
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const handleStepComplete = () => {
    setSteps(prev => {
      const updated = [...prev];
      updated[currentStep].completed = true;
      return updated;
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps complete - show completion screen
      setShowCompletion(true);
    }
  };

  const handleSkipOptional = () => {
    if (!currentStepData.required) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowCompletion(true);
      }
    }
  };

  const handleFinish = () => {
    const allRequiredComplete = steps.filter(s => s.required).every(s => s.completed);
    if (allRequiredComplete) {
      setShowCompletion(true);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canFinish = steps.filter(s => s.required).every(s => s.completed);

  // Show completion screen
  if (showCompletion) {
    return (
      <CompletionStep
        siteName={siteName}
        onGoToDashboard={onComplete}
        onReviewSetup={() => {
          setShowCompletion(false);
          setCurrentStep(0);
        }}
        stats={{
          processUnitsCount: 3,
          tagsCount: 15,
          assetsCount: 8,
          systemMappingsCount: 12,
          unitMappingsCount: 10,
          tagMappingsCount: 5,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <div className="bg-surface border-b border-default">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <img 
              src={otContinuumLogo} 
              alt="OT Continuum" 
              className="h-[70px]"
              style={{ objectFit: 'contain' }}
            />
            <div className="text-right">
              <div className="text-sm text-tertiary">Progress</div>
              <div className="text-2xl text-primary">{completedSteps} / {totalSteps}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">{siteName}</h1>
              <p className="text-secondary">
                Complete these steps to configure your site for operational monitoring
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 rounded-full overflow-hidden bg-elevated-1">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-primary)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar - Step Navigation */}
          <div className="col-span-3">
            <div className="card-ot">
              <h3 className="mb-4 text-xs text-tertiary uppercase tracking-wide">
                Setup Steps
              </h3>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className="w-full text-left rounded-lg transition-colors p-3"
                    style={{
                      backgroundColor: currentStep === index
                        ? 'var(--color-bg-elevated-1)'
                        : step.completed
                        ? 'var(--color-success-muted)'
                        : 'transparent',
                      border: `1px solid ${
                        currentStep === index
                          ? 'var(--color-primary)'
                          : step.completed
                          ? 'var(--color-success)'
                          : 'var(--color-border-default)'
                      }`
                    }}
                    data-testid={`onboarding-step-${step.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : currentStep === index ? (
                          <Circle className="w-5 h-5" style={{ color: 'var(--color-primary)', fill: 'var(--color-primary)' }} />
                        ) : (
                          <Circle className="w-5 h-5 text-tertiary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm flex items-center gap-2">
                          <span className={step.completed ? 'text-success' : 'text-primary'}>
                            {step.title}
                          </span>
                          {!step.required && (
                            <span className="text-xs text-tertiary">(Optional)</span>
                          )}
                        </div>
                        <div className="text-xs mt-1 text-tertiary">
                          Step {index + 1} of {steps.length}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {canFinish && (
                <div className="mt-6 pt-6 border-t border-default">
                  <button
                    onClick={handleFinish}
                    className="btn-success w-full flex items-center justify-center gap-2"
                    data-testid="onboarding-finish"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Complete Setup
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Current Step */}
          <div className="col-span-9">
            <div className="card-ot-lg">
              {/* Step Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2>{currentStepData.title}</h2>
                      {!currentStepData.required && (
                        <span className="badge-neutral">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-secondary">{currentStepData.description}</p>
                  </div>
                  <div className="text-sm text-tertiary">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>

                {currentStepData.required && (
                  <div className="alert-warning flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <strong>Required Step:</strong> This step must be completed before your site can be used for operational monitoring.
                    </div>
                  </div>
                )}
              </div>

              {/* Step Component */}
              <CurrentStepComponent
                siteId={siteId}
                siteName={siteName}
                onComplete={handleStepComplete}
                onSkip={handleSkipOptional}
                onBack={currentStep > 0 ? handleBack : undefined}
                isOptional={!currentStepData.required}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}