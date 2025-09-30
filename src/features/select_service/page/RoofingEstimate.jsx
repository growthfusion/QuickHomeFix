import React, { useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import Header from "@/components/layout/header";
import ProgressBar from "@/components/layout/progress-bar";

// Import all step components
import ServiceSelection from "@/components/steps/service-selection";
import EmailStep from "@/components/steps/email-step";
// Roofing steps
import RoofingTypeStep from "@/components/steps/roofing-type-step";
import RoofCountStep from "@/components/steps/roof-count-step";
import MaterialStep from "@/components/steps/material-step";
// Windows steps
import WindowTypeStep from "@/components/steps/window-type-step";
import WindowCountStep from "@/components/steps/window-count-step";
import WindowStyleStep from "@/components/steps/window-style-step";
//bathroom steps
import BathwallTypeStep from "@/components/steps/bathroom-wall";
// Solar steps
import SolarTypeStep from "@/components/steps/solar-type-step";
import RoofSizeStep from "@/components/steps/roof-size-step";
import EnergyBillStep from "@/components/steps/energy-bill-step";
//Gutter steps
import GutterTypeStep from "@/components/steps/gutter-type-step";
import GutterMaterialStep from "@/components/steps/gutter-material";
//Walkin steps
import WalkinTypeStep from "@/components/steps/Walkin-step";
import WalkTypeStep from "@/components/steps/walk-type-step";
// Common steps
import {AddressStep } from "@/components/steps/address-step";
import { AddressSteps } from "@/components/steps/address-steps";

import NameStep from "@/components/steps/name-step";
import PhoneStep from "@/components/steps/phone-step";
import CompleteStep from "@/components/steps/complete-step";
import BathshowerTypeStep from "@/components/steps/bathroom-shower";

// Step to component mapping
const stepComponents = {
  "service-selection": ServiceSelection,
  email: EmailStep,
  // Roofing specific
  "roofing-type": RoofingTypeStep,
  "roof-count": RoofCountStep,
  material: MaterialStep,
  // Windows specific
  "window-type": WindowTypeStep,
  "window-count": WindowCountStep,
  "window-style": WindowStyleStep,
  //bathroom specific
  "bathroom-wall": BathwallTypeStep,
  "bathroom-shower": BathshowerTypeStep,
  // Solar specific
  "solar-type": SolarTypeStep,
  "roof-size": RoofSizeStep,
  "energy-bill": EnergyBillStep,
  // gutter steps
  "gutter-type": GutterTypeStep,
  "gutter-material": GutterMaterialStep,
  // walkin steps
  "walkin-step": WalkinTypeStep,
  "walkin-type": WalkTypeStep,
  // Common steps
  dfaddress: AddressSteps,
  address: AddressStep,
  name: NameStep,
  phone: PhoneStep,
  complete: CompleteStep,
};

// Step name to route path mapping
const stepToRoutePath = {
  "roofing-type": "/roofing-type",
  "window-type": "/window-type",
  "solar-type": "/solar-type",
  "gutter-type": "/gutter-type",
  "gutter-material": "/gutter-material",
  "bathroom-wall": "/wall-option",
  "walkin-type": "/walkin-type",
  "complete": "/complete"
};

// Route path to service and step mapping
const routeToServiceAndStep = {
  "/roofing-type": { service: "roof", stepName: "roofing-type" },
  "/window-type": { service: "windows", stepName: "window-type" },
  "/solar-type": { service: "solar", stepName: "solar-type" },
  "/gutter-type": { service: "gutter", stepName: "gutter-type" },
  "/gutter-material": { service: "gutter", stepName: "gutter-material" },
  "/wall-option": { service: "bath", stepName: "bathroom-wall" },
  "/walkin-type": { service: "walk-in", stepName: "walkin-type" },
  "/complete": { stepName: "complete" }
};

function RoofingEstimate() {
  const { formData, currentStep, resetForm, updateFormData, setStep } = useFormStore();
  const isDarkMode = typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const navigate = useNavigate();
  const location = useLocation();

  // Sync route with form state
  useEffect(() => {
    const currentPath = location.pathname;
    
    // If we're on a specific step route
    if (routeToServiceAndStep[currentPath]) {
      const { service, stepName } = routeToServiceAndStep[currentPath];
      
      // Update service if needed
      if (service && formData.service !== service) {
        updateFormData("service", service);
      }
      
      // Find step index and update current step
      if (stepName && service) {
        const serviceFlow = getServiceFlow(service);
        const stepIndex = serviceFlow.steps.indexOf(stepName);
        
        if (stepIndex !== -1 && currentStep !== stepIndex + 1) {
          setStep(stepIndex + 1);
        }
      }
    }
  }, [location.pathname]);

  // Sync form state with route
  useEffect(() => {
    // Skip if we're on the main form route already
    if (location.pathname === "/roofing") {
      return;
    }
    
    // If we're at step 0 (service selection), stay on the main form route
    if (currentStep === 0) {
      navigate("/roofing");
      return;
    }
    
    // Get current step name
    if (formData.service) {
      const serviceFlow = getServiceFlow(formData.service);
      if (currentStep - 1 < serviceFlow.steps.length) {
        const stepName = serviceFlow.steps[currentStep - 1];
        
        // Check if this step has a dedicated route
        if (stepToRoutePath[stepName]) {
          // Only navigate if we're not already there
          if (location.pathname !== stepToRoutePath[stepName]) {
            navigate(stepToRoutePath[stepName]);
          }
        }
      }
    }
  }, [currentStep, formData.service]);

  // Reset form when the component mounts if needed
  useEffect(() => {
    // Check if we need to reset the form
    const needsReset = () => {
      // Always reset if query parameter ?new=true is present
      if (typeof window !== 'undefined' && window.location.search.includes('new=true')) {
        return true;
      }
      
      // Reset if we're at the complete step
      if (currentStep > 0 && formData.service) {
        const serviceFlow = getServiceFlow(formData.service);
        const currentStepName = serviceFlow.steps[currentStep - 1];
        return currentStepName === 'complete';
      }
      
      return false;
    };
    
    if (needsReset()) {
      resetForm();
    }
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Force a re-render when theme changes
      forceUpdate({});
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, []);

  // A simple way to force a re-render
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const getCurrentStepComponent = () => {
    if (currentStep === 0) {
      return ServiceSelection;
    }

    const serviceFlow = getServiceFlow(formData.service);
    const stepIndex = currentStep - 1;
    
    // Safety check for out-of-bounds
    if (stepIndex >= serviceFlow.steps.length) {
      resetForm(); // Reset if we're in an invalid state
      return ServiceSelection;
    }
    
    const stepName = serviceFlow.steps[stepIndex];
    return stepComponents[stepName] || ServiceSelection;
  };

  const StepComponent = getCurrentStepComponent();

  // Updated background colors
  const lightBackground = "#f8fbfe"; // Light blue/white for light mode
  const darkBackground = "#131b2a"; // Dark navy blue for dark mode

  return (
    <div 
      className="roofing-estimate-page"
      style={{
        position: "fixed", // full overlay
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        overflowY: "auto",
        zIndex: 2000,
        background: isDarkMode ? darkBackground : lightBackground,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <ProgressBar />

      <main className="">
        <StepComponent />
      </main>
    </div>
  );
}

export default RoofingEstimate;
