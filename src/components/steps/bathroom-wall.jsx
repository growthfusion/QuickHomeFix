"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";

// Import images with explicit paths (adjust if needed)
import add from "@/assets/images/brick-wall.png";
import minus from "@/assets/images/wall.png";
import block from "@/assets/images/prohibition.png";

// BathwallType Card Component
const WallOptionCard = ({ id, image, title, isSelected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(id)}
      className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/40 transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-1 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden cursor-pointer"
    >
      <div className={`absolute inset-0 ${
        isSelected
          ? "opacity-100 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 dark:from-blue-500/25 dark:via-purple-500/25 dark:to-pink-500/25"
          : "opacity-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8"
      } rounded-xl transition-opacity duration-500 group-hover:opacity-100`} />
      
      <div className="p-6 text-center relative z-10">
        <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-md group-hover:shadow-lg mb-4 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-650 dark:to-gray-600">
          <img 
            src={image} 
            alt={title}
            className="w-16 h-16 object-contain filter group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500"
            onError={(e) => {
              console.error(`Failed to load image for ${title}`);
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iMTIiIHk9IjEyIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjYWFhYWFhIj4/PC90ZXh0Pjwvc3ZnPg==";
            }}
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
      
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12" />
      </div>
    </div>
  );
};

const bathwallTypes = [
  { id: "add", name: "Add Walls", img: add },
  { id: "remove", name: "Remove Walls", img: minus },
  { id: "nochange", name: "No Change", img: block },
];

// Main component - export with correct name to match import
function BathwallTypeStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedType, setSelectedType] = useState(formData.bathwallType || null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    updateFormData("bathwallType", typeId);
    
    // Start navigation process with visual feedback
    setIsNavigating(true);
  };
  
  // Effect for automatic navigation after selection
  useEffect(() => {
    let timer;
    if (isNavigating && selectedType) {
      timer = setTimeout(() => {
        nextStep();
      }, 800); // Delay navigation to show selection feedback
    }
    
    return () => clearTimeout(timer);
  }, [isNavigating, selectedType, nextStep]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedType) {
      setIsNavigating(true);
      // Navigation is handled by the useEffect
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 transition-all duration-700 p-6">
      <Card className="mx-auto max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <CardContent className="p-8">
          <form data-tf-element-role="offer" onSubmit={handleSubmit}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Do you want to add or remove Bathroom Walls?</h2>
            </div>

            {/* Hidden TrustedForm field */}
            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl"
                   value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {bathwallTypes.map((type, index) => (
                <div 
                  key={type.id}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <WallOptionCard
                    id={type.id}
                    image={type.img}
                    title={type.name}
                    isSelected={selectedType === type.id}
                    onSelect={handleTypeSelect}
                  />
                </div>
              ))}
            </div>
            
          
            
            {/* Navigation status indicator */}
            {isNavigating && (
              <div className="text-center text-blue-600 dark:text-blue-400 mt-4 animate-fade-in">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Processing your selection...</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
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
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default BathwallTypeStep;
