import React from "react";
import { useFormStore } from "@/lib/store";
import { MapPin } from "lucide-react";

function LocationBanner() {
  const { formData, currentStep } = useFormStore();

  if (currentStep <= 1 || !formData.zipcode) return null;

  const getServiceLabel = () => {
    switch (formData.service) {
      case "windows": return "Window";
      case "solar": return "Solar";
      case "bath": return "Bath Remodeling";
      case "gutter": return "Gutter";
      case "tub": return "Walk-In Tub";
      case "shower": return "Walk-In Shower";
      default: return "Roofing";
    }
  };

  const location = formData.zipCity
    ? formData.zipState
      ? `${formData.zipCity}, ${formData.zipState}`
      : formData.zipCity
    : `Zip ${formData.zipcode}`;

  return (
    <div className="bg-slate-800">
      <div className="max-w-xl mx-auto px-4 py-2 flex items-center justify-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <span className="text-slate-200 text-xs font-medium">
          {getServiceLabel()} Professionals in {location}
        </span>
      </div>
    </div>
  );
}

export default LocationBanner;
