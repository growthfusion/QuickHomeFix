"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import FooterSteps from '@/components/layout/footerSteps'


function WindowCountStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedCount, setSelectedCount] = useState(formData.windowCount || null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleCountSelect = (count) => {
    setSelectedCount(count);
    updateFormData("windowCount", count);
    
    // Start navigation process with visual feedback
    setIsNavigating(true);
  };
  
  // Effect for automatic navigation after selection
  useEffect(() => {
    let timer;
    if (isNavigating && selectedCount) {
      timer = setTimeout(() => {
        nextStep();
      }, 800); // Delay navigation to show selection feedback
    }
    
    return () => clearTimeout(timer);
  }, [isNavigating, selectedCount, nextStep]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedCount) {
      setIsNavigating(true);
      // Navigation is handled by the useEffect
    }
  };

  return (
    <>
    <div style={{ background: '#f8fbfe', padding: '20px' }} className="">
      <Card className="mx-auto max-w-2xl bg-white shadow-sm border-gray-100 overflow-hidden">
        <CardContent className="p-8 pb-10">
          <form data-tf-element-role="offer" onSubmit={handleSubmit} aria-labelledby="window-count-heading">
            <div className="text-center mb-8">
              <h2 id="window-count-heading" className="text-2xl font-semibold mb-2">How many windows need service?</h2>
            </div>

            {/* Hidden TrustedForm field */}
            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl"
                   value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c"
            />
            
            <div role="group" aria-label="Window count options" className={`grid grid-cols-4 gap-4 mb-6 ${isLoaded ? 'animate-fadeIn' : 'opacity-0'}`}>
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button" // Important to specify button type to avoid form submission
                  className={`h-12 text-lg rounded-md transition-all duration-300 ${
                    selectedCount === num.toString() 
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:text-blue-600"
                  }`}
                  onClick={() => handleCountSelect(num.toString())}
                  aria-pressed={selectedCount === num.toString()}
                  aria-label={`${num} window${num > 1 ? 's' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            <div className={`transition-opacity duration-500 mb-8 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: '150ms' }}>
              <button
                type="button" // Important to specify button type to avoid form submission
                className={`w-full h-10 rounded-md transition-all duration-300 ${
                  selectedCount === "more" 
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:text-blue-600"
                }`}
                onClick={() => handleCountSelect("more")}
                aria-pressed={selectedCount === "more"}
              >
                More than 4
              </button>
            </div>
            
         
            
            {/* Navigation status indicator */}
            {isNavigating && (
              <div 
                className="text-center text-blue-600 mt-8 animate-fade-in"
                aria-live="polite" 
                role="status"
              >
                <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                <span className="text-sm">Processing your selection...</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      
      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s forwards;
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
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
    
        <FooterSteps />

    </>
  );
}

export default WindowCountStep;
