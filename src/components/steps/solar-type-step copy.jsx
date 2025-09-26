"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Solar types with emoji icons
const solarTypes = [
  { id: "panels", name: "Solar Install", icon: "☀️"},
  { id: "tiles", name: "Solar Repair", icon: "⚡" },
  { id: "battery", name: "Solar Upgrade", icon: "🔋"},
];

function SolarTypeStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSelect = (type) => {
    updateFormData("solarType", type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 transition-all duration-700 p-6">
      <Card className="mx-auto max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">What type of solar solution do you need?</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400 rounded-full mx-auto mt-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {solarTypes.map((type, index) => (
              <div 
                key={type.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.15}s`,
                  animationFillMode: 'both'
                }}
                onMouseEnter={() => setHoveredCard(type.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl dark:shadow-gray-900/40 transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-1 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden cursor-pointer"
                  onClick={() => handleSelect(type.id)}
                >
                  <div className={`absolute inset-0 ${
                    formData.solarType === type.id
                      ? "opacity-100 bg-gradient-to-br from-gray-200/15 via-gray-300/15 to-gray-200/15 dark:from-gray-600/25 dark:via-gray-700/25 dark:to-gray-600/25"
                      : "opacity-0 bg-gradient-to-br from-amber-500/8 via-yellow-500/8 to-orange-500/8"
                  } rounded-xl transition-opacity duration-500 group-hover:opacity-100`} />
                  
                  <div className="p-6 text-center relative z-10">
                    <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-md group-hover:shadow-lg mb-4 ${
                      formData.solarType === type.id
                        ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                        : "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-700 dark:via-gray-650 dark:to-gray-600"
                    }`}>
                      <span className="text-3xl filter group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500">{type.icon}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors duration-500">
                      {type.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                      {type.description}
                    </p>
                    
                    {formData.solarType === type.id && (
                      <div className="absolute right-3 top-3 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs animate-fade-in">
                        ✓
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
                    <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons - Updated layout with more gap and no arrow */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Button
              onClick={prevStep}
              variant="outline"
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 group relative overflow-hidden"
            >
              <span className="relative z-10">Back</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-600/50 to-transparent skew-x-12" />
              </div>
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!formData.solarType}
              className="bg-amber-500 hover:bg-amber-600 text-white group relative overflow-hidden"
            >
              <span className="relative z-10">Next</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
              </div>
            </Button>
          </div>
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
      `}</style>
    </div>
  );
}

export default SolarTypeStep;
