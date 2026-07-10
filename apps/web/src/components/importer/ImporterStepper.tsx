import { Check, Circle, FileUp, ListChecks, PlayCircle } from "lucide-react";

const steps = [
  { label: "Upload", icon: FileUp },
  { label: "Preview", icon: ListChecks },
  { label: "Process", icon: PlayCircle },
  { label: "Results", icon: Check },
];

export function ImporterStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav className="import-stepper" aria-label="Import progress steps">
      {steps.map((step, index) => {
        const Icon = index < currentStep ? Check : index === currentStep ? step.icon : Circle;
        const state = index < currentStep ? "complete" : index === currentStep ? "current" : "upcoming";
        return (
          <div className={`step-item ${state}`} key={step.label}>
            <span className="step-icon" aria-hidden="true"><Icon size={15} strokeWidth={2.2} /></span>
            <span>{step.label}</span>
            {index < steps.length - 1 ? <span className="step-line" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
