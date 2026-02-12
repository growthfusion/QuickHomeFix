import React from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";

function ProgressBar() {
  const { currentStep, formData } = useFormStore();

  if (currentStep === 0) return null;

  const serviceFlow = getServiceFlow(formData.service);
  const currentStepName = serviceFlow.steps[currentStep];
  const totalVisible = serviceFlow.totalSteps - 1;
  const rawProgress = Math.round((currentStep / totalVisible) * 100);
  const progress = currentStepName === "final" ? 99 : Math.min(rawProgress, 100);

  const getTitle = () => {
    switch (formData.service) {
      case "windows": return "Windows Estimate";
      case "solar": return "Solar Estimate";
      case "bath": return "Bath Remodeling Estimate";
      case "gutter": return "Gutter Estimate";
      case "tub": return "Walk-in Tub Estimate";
      case "shower": return "Walk-in Shower Estimate";
      default: return "Roofing Estimate";
    }
  };

  return (
    <div className="px-4 sm:px-8 pt-3 pb-2 bg-white">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{getTitle()}</span>
          <span className="text-xs font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
