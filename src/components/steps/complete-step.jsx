"use client"

import React, { useEffect, useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

function CompleteStep() {
  const { formData } = useFormStore();
  const [animationComplete, setAnimationComplete] = useState(false);

  // Trigger animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 400);
    
    return () => clearTimeout(timer);
  }, []);

  const getServiceMessage = () => {
    switch (formData.service) {
      case "windows":
        return {
          title: "Thank You For Your Windows Request!",
          message:
            "Your windows service estimate request has been submitted successfully. One of our window specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "solar":
        return {
          title: "Thank You For Your Solar Request!",
          message:
            "Your solar energy estimate request has been submitted successfully. One of our solar specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "bath":
        return {
          title: "Thank You For Your Bath Remodeling Request!",
          message:
            "Your bath remodeling estimate request has been submitted successfully. One of our remodeling specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "gutter":
        return {
          title: "Thank You For Your Gutter Service Request!",
          message:
            "Your gutter service estimate request has been submitted successfully. One of our gutter specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "walk-in":
        return {
          title: "Thank You For Your Walk-in-Tub/Shower Request!",
          message:
            "Your walk-in-tub/shower estimate request has been submitted successfully. One of our bathroom specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      default:
        return {
          title: "Thank You For Your Request!",
          message:
            "Your roofing service estimate request has been submitted successfully. One of our roofing specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
    }
  };

  const { title, message } = getServiceMessage();

  return (
    <Card className="mx-auto max-w-2xl shadow-lg border border-green-100">
      <CardContent className="p-10 text-center relative overflow-hidden">
        {/* Background success glow */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-green-50 via-green-100 to-green-50 opacity-0 transition-opacity duration-1500 ${
            animationComplete ? 'opacity-100' : ''
          }`}
        />
        
        {/* Success circle animation */}
        <div className="relative z-10 mb-6">
          <div className="success-circle">
            <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
              <circle 
                className="success-circle-bg" 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="#E0F2E9" 
                strokeWidth="8"
              />
              <circle 
                className={`success-circle-progress ${animationComplete ? 'animate' : ''}`}
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="#22C55E" 
                strokeWidth="8" 
                strokeDasharray="289.02652413026095" 
                strokeDashoffset="289.02652413026095" 
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <CheckCircle 
              className={`w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 transition-all duration-500 ${
                animationComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`} 
            />
          </div>
        </div>
        
        {/* Content with animation */}
        <div className={`transition-all duration-700 delay-500 transform ${
          animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">{title}</h2>
          <p className="text-gray-600 mb-0 leading-relaxed">{message}</p>
        </div>
      </CardContent>
      
      {/* Animated border */}
      <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
        <div className={`h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-1000 ease-out ${
          animationComplete ? 'w-full' : 'w-0'
        }`}></div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        .success-circle-progress {
          transition: stroke-dashoffset 1s ease-out;
        }
        
        .success-circle-progress.animate {
          stroke-dashoffset: 0;
        }
      `}</style>
    </Card>
  );
}

export default CompleteStep;
