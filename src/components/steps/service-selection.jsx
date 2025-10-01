import React, { useState, useEffect } from 'react';
import { useFormStore } from "@/lib/store";
import { useNavigate } from 'react-router-dom';

import bath from '@/assets/images/bath-tub.png';
import roof from '@/assets/images/roof.png';
import solar from '@/assets/images/solar-panel.png';
import windows from '@/assets/images/window.png';
import shower from '@/assets/images/showerr.png';
import gutter from '@/assets/images/round.png';

// Service Card Component with enhanced ribbon-style popular indicator
// Service Card Component with a working, robust ribbon
const ServiceCard = ({ id, image, title, isSelected, onSelect, isPopular }) => {
  return (
    <div 
      onClick={() => onSelect(id)}
      className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/40 transition-all duration-500 ease-out border border-gray-200/60 dark:border-gray-700/60 overflow-hidden cursor-pointer h-full"
    >
      {/* Popular Ribbon - CORRECTED IMPLEMENTATION */}
      {isPopular && (
        <div className="absolute top-0 right-0 h-24 w-24 overflow-hidden z-20">
          <div className="absolute transform rotate-45 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center font-semibold uppercase text-[11px] tracking-wider py-1 right-[-35px] top-[25px] w-[150px] shadow-md border-t border-b border-blue-400/30">
            Popular
          </div>
        </div>
      )}
      
      {/* Card content */}
      <div className={`absolute inset-0 ${
        isSelected
          ? "opacity-100 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-pink-500/25"
          : "opacity-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8"
      } rounded-xl transition-opacity duration-500 group-hover:opacity-100`} />
      
      <div className="p-6 text-center relative z-10 flex flex-col items-center justify-center h-full">
        <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-md group-hover:shadow-lg mb-4 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-650 dark:to-gray-600">
          <img 
            src={image} 
            alt={title}
            className="w-16 h-16 object-contain filter group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500"
          />
        </div>
        
        <h3 className={`font-semibold text-base ${
          isSelected
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
        } transition-colors duration-500`}>
          {title}
        </h3>
        
        {isSelected && (
          <div className="absolute right-3 bottom-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs animate-fade-in">
            ✓
          </div>
        )}
      </div>
      
      {/* Shimmer on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12" />
      </div>
    </div>
  );
};

function ServiceSelection() {
  const { formData, updateFormData, resetForm, setStep } = useFormStore();
  const [selectedService, setSelectedService] = useState(formData.service || null);
  const navigate = useNavigate();
  
  // Add automatic navigation delay
  const [isNavigating, setIsNavigating] = useState(false);

  // Services array with paths
  const services = [
    { id: "roof", name: "Roof Services", image: roof, path: "/quote/roof" },
    { id: "windows", name: "Windows", image: windows, isPopular: true, path: "/quote/windows" },
    { id: "bath", name: "Bath Remodeling", image: bath, path: "/quote/bath" },
    { id: "solar", name: "Solar Energy", image: solar, path: "/quote/solar" },
    { id: "gutter", name: "Gutter Services", image: gutter, path: "/quote/gutter" },
    { id: "walk-in", name: "Walk-In-Tub/Shower", image: shower, path: "/quote/walk-in" },
  ];

  // Reset form when component mounts to ensure clean state
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    updateFormData("service", serviceId);
    
    // Start navigation process with visual feedback
    setIsNavigating(true);
  };
  
  // Effect for automatic navigation after selection
  useEffect(() => {
    let timer;
    if (isNavigating && selectedService) {
      const selectedServiceData = services.find(service => service.id === selectedService);
      
      timer = setTimeout(() => {
        // Navigate to the appropriate page based on service selection
        if (selectedServiceData && selectedServiceData.path) {
          // Set the appropriate step for the service flow
          setStep(1); // Move to first step after service selection
          
          // Navigate to new path
          navigate(selectedServiceData.path, { replace: true });
        }
      }, 800); // Delay navigation to show selection feedback
    }
    
    return () => clearTimeout(timer);
  }, [isNavigating, selectedService, navigate, services, setStep]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedService) {
      setIsNavigating(true);
      // Form submission is handled by useEffect above
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 transition-all duration-700 p-6">
      <div className="mx-auto max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Select Your Service</h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Choose the home service you need to get started with your free quote!
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.15}s`,
                  animationFillMode: 'both'
                }}
              >
                <ServiceCard
                  id={service.id}
                  image={service.image}
                  title={service.name}
                  isSelected={selectedService === service.id}
                  onSelect={handleServiceSelect}
                  isPopular={service.isPopular}
                />
              </div>
            ))}
          </div>
          
          {/* Navigation status indicator */}
          {isNavigating && (
            <div className="text-center text-blue-600 dark:text-blue-400 mt-4 animate-fade-in">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Proceeding to next step...</span>
            </div>
          )}
        </form>
      </div>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
            opacity: 0.7;
          }
          50% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0.7;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), transparent);
          background-size: 200% 100%;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default ServiceSelection;
