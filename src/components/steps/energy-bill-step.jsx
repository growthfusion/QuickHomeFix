"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const billRanges = ["$50-100", "$100-200", "$200-300", "$300+"];

function EnergyBillStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSelect = (bill) => {
    updateFormData("energyBill", bill);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 transition-all duration-700 p-6">
      <Card className="mx-auto max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">What is your monthly energy bill?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">This helps us estimate your potential solar savings</p>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-4"></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {billRanges.map((bill, index) => (
              <div 
                key={bill}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <button
                  className={`group min-w-[120px] h-14 text-lg px-6 rounded-md shadow-sm transition-all duration-300 ease-out ${
                    formData.energyBill === bill 
                      ? "bg-blue-600 text-white" 
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/90"
                  }`}
                  onClick={() => handleSelect(bill)}
                >
                  <span>{bill}</span>
                </button>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
            <div className="col-span-1">
              <Button
                onClick={prevStep}
                variant="outline"
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                size="sm"
              >
                Back
              </Button>
            </div>
            <div className="col-span-1">
              <Button
                onClick={nextStep}
                disabled={!formData.energyBill}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Next
              </Button>
            </div>
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

export default EnergyBillStep;
