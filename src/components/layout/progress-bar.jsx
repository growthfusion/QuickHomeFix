import React from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";

function ProgressBar() {
  const { currentStep, formData } = useFormStore();

  if (currentStep === 0) return null;

  const serviceFlow = getServiceFlow(formData.service);
  const progress = Math.round((currentStep / serviceFlow.totalSteps) * 100);

  const getTitle = () => {
    switch (formData.service) {
      case "windows":
        return "Windows Service Estimate";
      case "solar":
        return "Solar Energy Estimate";
      case "bath":
        return "Bath Remodeling Estimate";
      case "gutter":
        return "Gutter Service Estimate";
      case "walk-in":
        return "Walk-in-Tub/Shower Estimate";
      default:
        return "Roofing Service Estimate";
    }
  };

  return (
    <div className="p-6">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">{getTitle()}</h2>
        <div className="max-w-3xl mx-auto">
          <div className="h-4 bg-opacity-20 bg-gray-400 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full progress-animation"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center mt-3">
            <span className="text-sm font-bold bg-blue-600 hover:bg-blue-700 transition-colors text-white px-5 py-1.5 rounded-full pulse-animation">
              {progress}% Complete
            </span>
          </div>
        </div>
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        .progress-animation {
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .pulse-animation {
          animation: pulse 2s infinite;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        }
      `}</style>
    </div>
  );
}

export default ProgressBar;
