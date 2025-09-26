"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

function RoofCountStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Animation on load
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleCountSelect = (count) => {
    updateFormData("roofCount", count);
  };

  return (
    <div style={{ background: '#f8fbfe', padding: '20px' }}>
      <Card className="mx-auto max-w-2xl bg-white shadow-sm border-gray-100 overflow-hidden">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-blue-50 rounded-full">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">How many roofs need service?</h2>
          </div>
          
          {/* Original button sizing and layout, with animation */}
          <div className={`grid grid-cols-4 gap-4 mb-6 ${isLoaded ? 'animate-fadeIn' : 'opacity-0'}`}>
            {[1, 2, 3, 4].map((num) => (
              <Button
                key={num}
                variant={formData.roofCount === num.toString() ? "default" : "outline"}
                className={`h-12 text-lg ${
                  formData.roofCount === num.toString() 
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:text-blue-600"
                }`}
                onClick={() => handleCountSelect(num.toString())}
              >
                {num}
              </Button>
            ))}
          </div>
          
          <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '150ms' }}>
            <Button
              variant={formData.roofCount === "more" ? "default" : "outline"}
              className={`w-full h-10 ${
                formData.roofCount === "more" 
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:text-blue-600"
              }`}
              onClick={() => handleCountSelect("more")}
            >
              More than 4
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between p-6 border-t bg-gray-50">
          <Button 
            variant="outline" 
            onClick={prevStep}
            className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
          >
            Back
          </Button>
          <Button 
            onClick={nextStep}
            disabled={!formData.roofCount}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next
          </Button>
        </CardFooter>
      </Card>
      
      {/* Simple animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s forwards;
        }
      `}</style>
    </div>
  );
}

export default RoofCountStep;
