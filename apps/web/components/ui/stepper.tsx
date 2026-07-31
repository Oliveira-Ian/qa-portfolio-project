import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** 0-indexed — steps before it read as complete, the one at it as current. */
  currentStep: number;
  className?: string;
}

/**
 * A horizontal step indicator for a linear workflow (an order or service
 * request moving through its statuses). Presentational only — the caller
 * owns what `currentStep` means and how it advances.
 */
export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full', className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className={cn('flex items-start', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isComplete && !isCurrent && 'border-border text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <div className="w-20 text-center">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isCurrent || isComplete ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {step.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                ) : null}
              </div>
            </div>
            {!isLast ? (
              <div
                aria-hidden="true"
                className={cn('mt-4 h-px flex-1', isComplete ? 'bg-primary' : 'bg-border')}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
