import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";

import bath from "@/assets/images/bath-tub.png";
import roof from "@/assets/images/roof.png";
import solar from "@/assets/images/solar-panel.png";
import windows from "@/assets/images/window.png";
import shower from "@/assets/images/showerr.png";
import gutter from "@/assets/images/round.png";
import buket from "@/assets/images/buket.png";

import FooterSteps from "@/components/layout/footerSteps";

const ServiceCard = ({ id, image, title, isSelected, onSelect, isPopular }) => (
  <div
    onClick={() => onSelect(id)}
    className={`relative bg-white rounded-xl border cursor-pointer flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6 card-smooth transition-shadow duration-200 ${
      isSelected
        ? "border-blue-600 bg-blue-50/60 shadow-md"
        : "border-gray-200"
    }`}
  >
    <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-50">
      <img
        src={image}
        alt={title}
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        loading="lazy"
      />
    </div>

    <h3 className={`font-semibold text-base sm:text-lg ${
      isSelected ? "text-blue-600" : "text-gray-800"
    }`}>
      {title}
    </h3>

    {isPopular && (
      <span className="ml-auto bg-blue-600 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0">
        Popular
      </span>
    )}

    {isSelected && (
      <div className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0">
        ✓
      </div>
    )}
  </div>
);

function ServiceSelection() {
  const { formData, updateFormData, resetForm, setStep } = useFormStore();
  const [selectedService, setSelectedService] = useState(formData.service || null);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const services = [
    { id: "roof", name: "Roof Services", image: roof, path: "/get-quotes/roof" },
    { id: "windows", name: "Windows", image: windows, isPopular: true, path: "/get-quotes/windows" },
    { id: "bath", name: "Bath Remodeling", image: bath, path: "/get-quotes/bath" },
    { id: "solar", name: "Solar Energy", image: solar, path: "/get-quotes/solar" },
    { id: "gutter", name: "Gutter Services", image: gutter, path: "/get-quotes/gutter" },
    { id: "tub", name: "Walk-In-Tub", image: buket, path: "/get-quotes/tub" },
    { id: "shower", name: "Walk-In-Shower", image: shower, path: "/get-quotes/shower" },
  ];

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    updateFormData("service", serviceId);
    setIsNavigating(true);
  };

  useEffect(() => {
    let timer;
    if (isNavigating && selectedService) {
      const selected = services.find((s) => s.id === selectedService);
      timer = setTimeout(() => {
        if (selected?.path) {
          setStep(1);
          navigate(selected.path, { replace: true });
        }
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [isNavigating, selectedService, navigate, setStep]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedService) setIsNavigating(true);
  };

  return (
    <>
      <div className="px-4 py-4 sm:px-8 sm:py-6 flex-1 flex flex-col">
        <div className="mx-auto max-w-3xl w-full flex-1 flex flex-col">
          <form data-tf-element-role="offer" onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Select Your Service
              </h2>
              <p className="text-sm sm:text-base text-gray-500">
                Choose the home service you need to get started with your free quote.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  image={service.image}
                  title={service.name}
                  isSelected={selectedService === service.id}
                  onSelect={handleServiceSelect}
                  isPopular={service.isPopular}
                />
              ))}
            </div>
          </form>
        </div>
      </div>
      <FooterSteps />
    </>
  );
}

export default ServiceSelection;
