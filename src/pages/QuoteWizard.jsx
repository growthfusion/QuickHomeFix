import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ShieldCheck, Award, BadgeCheck, EyeOff } from "lucide-react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow, isValidService } from "@/lib/service-flows";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import wizardLogo from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";
import ServiceLandingPage from "@/components/layout/ServiceLandingPage";
import { getServiceLandingData } from "@/lib/service-landing-data";

// Step components
import ServiceSelection from "@/components/steps/service-selection";
import EmailStep from "@/components/steps/email-step";
import RoofingTypeStep from "@/components/steps/roofing-type-step";
import RoofCountStep from "@/components/steps/roof-count-step";
import RoofMaterialStep from "@/components/steps/roof-material-step";
import WindowTypeStep from "@/components/steps/window-type-step";
import WindowCountStep from "@/components/steps/window-count-step";
import WindowStyleStep from "@/components/steps/window-style-step";
import BathNeedsStep from "@/components/steps/bath-needs-step";
import BathwallTypeStep from "@/components/steps/bathroom-wall";
import BathshowerTypeStep from "@/components/steps/bathroom-shower";
import SolarTypeStep from "@/components/steps/solar-type-step";
import SunExposureStep from "@/components/steps/solar-style-step";
import GutterTypeStep from "@/components/steps/gutter-type-step";
import GutterMaterialStep from "@/components/steps/gutter-material";
import TubReasonStep from "@/components/steps/tub-reason-step";
import WalkinOptionCard from "@/components/steps/walkin-step";
import WalkTypeStep from "@/components/steps/walk-type-step";
import { AddressSteps } from "@/components/steps/address-steps";
import NameStep from "@/components/steps/name-step";
import PhoneStep from "@/components/steps/phone-step";
import CompleteStep from "@/components/steps/complete-step";
import ZipcodeStep from "@/components/steps/zipcode-step";
import OwnershipStep from "@/components/steps/ownership-step";
import DetailsStep from "@/components/steps/details-step";
import FinalStep from "@/components/steps/final-step";

const stepComponents = {
  "service-selection": ServiceSelection,
  zipcode: ZipcodeStep,
  ownership: OwnershipStep,
  details: DetailsStep,
  final: FinalStep,
  email: EmailStep,
  "roofing-type": RoofingTypeStep,
  "roof-count": RoofCountStep,
  material: RoofMaterialStep,
  "window-type": WindowTypeStep,
  "window-count": WindowCountStep,
  "window-style": WindowStyleStep,
  "bath-needs": BathNeedsStep,
  "bathroom-wall": BathwallTypeStep,
  "bathroom-shower": BathshowerTypeStep,
  "solar-type": SolarTypeStep,
  "roof-size": SunExposureStep,
  "gutter-type": GutterTypeStep,
  "gutter-material": GutterMaterialStep,
  "tub-reason": TubReasonStep,
  "walkin-step": WalkinOptionCard,
  walk: WalkinOptionCard,
  "walkin-type": WalkTypeStep,
  dfaddress: AddressSteps,
  name: NameStep,
  phone: PhoneStep,
  complete: CompleteStep,
};

function QuoteWizard() {
  const { formData, currentStep, updateFormData, setStep, prevStep, isFormStarted, resetAll } = useFormStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { service } = useParams();
  const scrollRef = useRef(null);

  // Scroll to top whenever the step or page changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [currentStep, location.pathname]);

  const isCompletePath = location.pathname === "/get-quotes/complete";

  // Show landing page on first visit to a valid service URL
  const [showLanding, setShowLanding] = useState(() => {
    // Only show landing if we're arriving at a specific service route
    // and the user hasn't already started the wizard for this service
    if (!service || !isValidService(service)) return false;
    if (isCompletePath) return false;
    // Check if landing data exists for this service
    return !!getServiceLandingData(service);
  });

  // If user already started the wizard (e.g. navigated back), skip landing
  useEffect(() => {
    if (isFormStarted && formData.service === service) {
      setShowLanding(false);
    }
  }, [isFormStarted, formData.service, service]);

  // Handle CTA click from landing page — transition to wizard
  const handleStartWizard = (zip) => {
    if (!service || !isValidService(service)) return;

    // Set service
    updateFormData("service", service);

    // If a valid 5-digit ZIP was entered, save it and skip the zipcode step
    if (zip && zip.length === 5) {
      updateFormData("zipcode", zip);
      const flow = getServiceFlow(service);
      const zipIdx = flow.steps.indexOf("zipcode");
      // Jump past the zipcode step to the next one
      if (zipIdx !== -1 && zipIdx + 1 < flow.steps.length) {
        setStep(zipIdx + 2); // +2 because currentStep is 1-indexed
      } else {
        // Fallback: start at initial step
        const idx = flow.steps.indexOf(flow.initialStep);
        if (idx !== -1) setStep(idx + 1);
      }
    } else {
      // No ZIP entered — start at the zipcode step as normal
      const flow = getServiceFlow(service);
      const idx = flow.steps.indexOf(flow.initialStep);
      if (idx !== -1) setStep(idx + 1);
    }

    setShowLanding(false);
  };

  // Standard wizard init (only runs when landing is dismissed)
  useEffect(() => {
    if (showLanding) return;

    if (isCompletePath) {
      if (!formData.service) updateFormData("service", "roof");
      const flow = getServiceFlow(formData.service || "roof");
      const idx = flow.steps.indexOf("complete");
      if (idx !== -1) setStep(idx + 1);
      return;
    }

    if (service && isValidService(service) && formData.service !== service) {
      updateFormData("service", service);
      const flow = getServiceFlow(service);
      const idx = flow.steps.indexOf(flow.initialStep);
      if (idx !== -1) setStep(idx + 1);
    }
  }, [service, isCompletePath, formData.service, updateFormData, setStep, showLanding]);

  // ─── Render landing page ───
  if (showLanding && service) {
    const landingData = getServiceLandingData(service);
    if (landingData) {
      return <ServiceLandingPage data={landingData} onStartWizard={handleStartWizard} />;
    }
  }

  // ─── Render wizard ───
  const getStepComponent = () => {
    if (isCompletePath) return CompleteStep;
    if (currentStep === 0) return ServiceSelection;

    const flow = getServiceFlow(formData.service);
    if (!flow) return ServiceSelection;

    const stepIndex = currentStep - 1;
    if (stepIndex >= flow.steps.length) return ServiceSelection;

    const stepName = flow.steps[stepIndex];
    return stepComponents[stepName] || ServiceSelection;
  };

  const StepComponent = getStepComponent();

  return (
    <div
      ref={scrollRef}
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        zIndex: 2000,
        background: "#ffffff",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            resetAll();
            navigate("/");
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
        >
          <img src={wizardLogo} alt="QuickHomeFix" className="w-12 h-12 sm:w-20 sm:h-20 object-contain brightness-0" />
          <span className="text-base sm:text-2xl font-extrabold text-gray-900">
            QuickHomeFix
          </span>
        </a>
      </div>
      <main key={currentStep} className="animate-fade-in">
        <StepComponent />
      </main>

      {/* Trust Badge */}
      <div className="px-4 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
        <div className="max-w-md mx-auto">
          <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Verified ribbon */}
            <div
              className="absolute z-10"
              style={{ top: 0, right: 0, width: 80, height: 80, overflow: "hidden", pointerEvents: "none" }}
            >
              <div
                className="bg-green-500 text-white text-[9px] font-bold uppercase tracking-widest text-center"
                style={{
                  position: "absolute",
                  top: 14,
                  right: -28,
                  width: 120,
                  transform: "rotate(45deg)",
                  padding: "4px 0",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              >
                Verified
              </div>
            </div>
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800">Trusted Site</span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">
                {new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
              </span>
            </div>
            {/* Trust items */}
            <div className="grid grid-cols-4 divide-x divide-gray-100 bg-white">
              {[
                { icon: ShieldCheck, label: "Secure", desc: "256-bit encryption", color: "text-blue-500" },
                { icon: Award, label: "Guaranteed", desc: "100% satisfaction", color: "text-yellow-500" },
                { icon: BadgeCheck, label: "Verified", desc: "Identity confirmed", color: "text-green-500" },
                { icon: EyeOff, label: "Private", desc: "Data protection", color: "text-gray-600" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center py-4 px-1">
                  <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} mb-1.5`} />
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-800">{item.label}</span>
                  <span className="text-[8px] sm:text-[10px] text-gray-400 text-center leading-tight mt-0.5">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Privacy & Terms */}
      <footer className="px-4 sm:px-6 py-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} QuickHomeFix. All rights reserved.</span>
          <span className="hidden sm:inline">|</span>
          <div className="flex items-center gap-3">
            <a href="/privacy-policy" className="underline underline-offset-2">Privacy Policy</a>
            <a href="/terms-of-service" className="underline underline-offset-2">Terms of Service</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default QuoteWizard;
