import React from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";

function StepProgressBar() {
  const { currentStep, formData } = useFormStore();

  if (currentStep === 0) return null;

  const serviceFlow = getServiceFlow(formData.service);
  const stepIndex = currentStep - 1;
  const currentStepName = serviceFlow.steps[stepIndex];

  // Total visible steps = all steps minus "complete"
  const totalVisible = serviceFlow.totalSteps - 1;

  // Progress based on current step position
  const stepNumber = stepIndex + 1;
  const rawProgress = Math.round((stepNumber / totalVisible) * 100);

  // Don't show 100% until actually complete — cap the last step at 95%
  const progress = currentStepName === "final"
    ? 95
    : Math.min(rawProgress, 100);

  return (
    <div className="h-2 bg-gray-100 rounded-t-2xl overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-700 ease-out rounded-r-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default StepProgressBar;
