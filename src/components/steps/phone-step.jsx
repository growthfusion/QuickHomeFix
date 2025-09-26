"use client"

import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { TrustBadge } from '@/components/steps/trust-badge ';


function PhoneStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <>
    <Card className="mx-auto max-w-3xl shadow-sm border border-gray-200">
      <CardContent className="p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-3">Enter Your Phone Number</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            This is the last step! When you provide your phone number, you will receive a quote from a trusted home
            services provider.
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Phone Card Section */}
          <Card className="mb-8 border border-gray-200 bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-6">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone || ""}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full pl-10 bg-white ${
                    isFocused ? "ring-2 ring-blue-100 border-blue-300" : ""
                  }`}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Navigation buttons - Back and Get Quote */}
          <div className="grid grid-cols-2 gap-2">
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
                disabled={!formData.phone}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Get Free Quote
              </Button>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 mt-6">
            Your information is secure and confidential
          </div>
        </div>
      </CardContent>
    </Card>
              <TrustBadge />
                  
    </>
  );
}

export default PhoneStep;
