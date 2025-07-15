import { CheckCircle, Clock, Download, Upload } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const steps = [
    { label: "Upload Data", icon: Upload },
    { label: "Configure Shifts", icon: Clock },
    { label: "Process & Review", icon: CheckCircle },
    { label: "Download Results", icon: Download },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Process Your Punch Data</h2>
        <div className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const Icon = step.icon;

          return (
            <div key={stepNumber} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive 
                  ? 'bg-primary text-white' 
                  : isCompleted 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200 rounded mx-4">
                  <div 
                    className={`h-1 rounded transition-all duration-500 ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-gray-200'
                    }`}
                    style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
