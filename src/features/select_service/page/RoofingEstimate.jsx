import React, { useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import Header from "@/components/layout/header";
import ProgressBar from "@/components/layout/progress-bar";

// Import all step components
import ServiceSelection from "@/components/steps/service-selection";
import EmailStep from "@/components/steps/email-step"
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
import SunExposureStep from "@/components/steps/roof-size-step";
//Gutter steps
import GutterTypeStep from "@/components/steps/gutter-type-step";
import GutterMaterialStep from "@/components/steps/gutter-material";
//Walkin steps
import WalkinOptionCard from "@/components/steps/Walkin-step";
import WalkTypeStep from "@/components/steps/walk-type-step";
// Common steps
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
  "roof-size": SunExposureStep,
  // gutter steps
  "gutter-type": GutterTypeStep,
  "gutter-material": GutterMaterialStep,
  // walkin steps
  "walkin-step": WalkinOptionCard,
  "walkin-type": WalkTypeStep,
  // Common steps
  dfaddress: AddressSteps,
  name: NameStep,
  phone: PhoneStep,
  complete: CompleteStep,
};

// Service routes configuration
const serviceRoutes = {
  "roof": {
    path: "/get-quotes/roof",
    initialStep: "roofing-type"
  },
  "windows": {
    path: "/get-quotes/windows",
    initialStep: "window-type"
  },
  "solar": {
    path: "/get-quotes/solar",
    initialStep: "solar-type"
  },
  "gutter": {
    path: "/get-quotes/gutter",
    initialStep: "gutter-type"
  },
  "bath": {
    path: "/get-quotes/bath",
    initialStep: "bathroom-wall"
  },
  "tub": {
    path: "/get-quotes/tub",
    initialStep: "walkin-step"
  },
  "shower": {
    path: "/get-quotes/shower",
    initialStep: "walkin-step"
  }
};

function RoofingEstimate() {
  const { formData, currentStep, resetForm, updateFormData, setStep } = useFormStore();
  const isDarkMode = typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const navigate = useNavigate();
  const location = useLocation();
  const { service } = useParams();

  // Handle direct navigation to complete page
  useEffect(() => {
    if (location.pathname === "/get-quotes/complete") {
      // Find the complete step in the service flow
      if (!formData.service) {
        // If no service is selected, set a default one
        const defaultService = "roof";
        updateFormData("service", defaultService);
      }
      
      // Find the complete step in the service flow
      const serviceFlow = getServiceFlow(formData.service || "roof");
      const completeStepIndex = serviceFlow.steps.indexOf("complete");
      
      if (completeStepIndex !== -1) {
        setStep(completeStepIndex + 1);
      }
    }
  }, [location.pathname, formData.service, updateFormData, setStep]);

  // Set service from route parameter if available
  useEffect(() => {
    if (service && serviceRoutes[service] && formData.service !== service) {
      console.log("Setting service from route param:", service);
      updateFormData("service", service);
      
      // Set to initial step for this service
      const serviceFlow = getServiceFlow(service);
      
      // If we're on the complete path, set to complete step
      if (location.pathname === "/get-quotes/complete") {
        const completeStepIndex = serviceFlow.steps.indexOf("complete");
        if (completeStepIndex !== -1) {
          setStep(completeStepIndex + 1);
        }
      } else {
        // Otherwise set to initial step
        const initialStep = serviceRoutes[service].initialStep;
        const stepIndex = serviceFlow.steps.indexOf(initialStep);
        
        if (stepIndex !== -1) {
          setStep(stepIndex + 1);
        }
      }
    }
  }, [service, formData.service, location.pathname, updateFormData, setStep]);

  // Handle direct URL navigation to service pages
  useEffect(() => {
    // Special handling for complete page
    if (location.pathname === "/get-quotes/complete") {
      return; // This is handled by the first useEffect
    }
    
    if (location.pathname.startsWith('/get-quotes/') && location.pathname !== "/get-quotes") {
      const routeService = location.pathname.split('/')[2];
      
      if (routeService && serviceRoutes[routeService] && formData.service !== routeService) {
        updateFormData("service", routeService);
        
        const serviceFlow = getServiceFlow(routeService);
        const initialStep = serviceRoutes[routeService].initialStep;
        const stepIndex = serviceFlow.steps.indexOf(initialStep);
        
        if (stepIndex !== -1) {
          setStep(stepIndex + 1);
        }
      }
    }
  }, [location.pathname, formData.service, updateFormData, setStep]);

  // The rest of your component (getCurrentStepComponent, rendering, etc.)
  const getCurrentStepComponent = () => {
    // Special case for complete page
    if (location.pathname === "/get-quotes/complete") {
      return CompleteStep;
    }
    
    if (currentStep === 0) {
      return ServiceSelection;
    }

    const serviceFlow = getServiceFlow(formData.service);
    if (!serviceFlow) return ServiceSelection;
    
    const stepIndex = currentStep - 1;
    if (stepIndex >= serviceFlow.steps.length) return ServiceSelection;
    
    const stepName = serviceFlow.steps[stepIndex];
    
    if (stepName === "complete") {
      return CompleteStep;
    }
    
    return stepComponents[stepName] || ServiceSelection;
  };

  const StepComponent = getCurrentStepComponent();

  // Updated background colors
  const lightBackground = "#f8fbfe";
  const darkBackground = "#131b2a";

  return (
    <div 
      className="roofing-estimate-page"
      style={{
        position: "fixed",
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
      
      {/* Only show ProgressBar if not on complete page */}
      {location.pathname !== "/get-quotes/complete" && <ProgressBar />}

      <main className="">
        <StepComponent />
      </main>
    </div>
  );
}


export default RoofingEstimate;
