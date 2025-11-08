import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  number: number;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                    isComplete && 'bg-green-500 text-white',
                    isActive && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    !isComplete && !isActive && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isActive && 'text-blue-600',
                      isComplete && 'text-green-600',
                      !isActive && !isComplete && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 max-w-[120px]">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 transition-all duration-300',
                    isComplete ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller screens
interface CompactProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function CompactProgressSteps({ steps, currentStep, className }: CompactProgressStepsProps) {
  const currentStepData = steps.find(s => s.number === currentStep);
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">
          {currentStepData?.label}
        </p>
        <p className="text-xs text-gray-500">
          Step {currentStep} of {steps.length}
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {currentStepData?.description && (
        <p className="text-xs text-gray-500 mt-2">
          {currentStepData.description}
        </p>
      )}
    </div>
  );
}
