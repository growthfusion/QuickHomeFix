"use client"

import React, { useEffect, useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge } from '@/components/steps/trust-badge ';
import { MapPin } from "lucide-react";

export function AddressStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [addressDetected, setAddressDetected] = useState(false);
  const [errors, setErrors] = useState({});
  const [zipTouched, setZipTouched] = useState(false);
  
  // Validation function for zipcode
  const validateZipcode = (zip) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };
  
  // Check if form is valid
  const isFormValid = formData.address && 
                     formData.city && 
                     formData.state && 
                     formData.zipcode && 
                     validateZipcode(formData.zipcode) &&
                     formData.isOwner !== undefined &&
                     formData.canMakeChanges !== undefined;

  // Simulate auto-filling address from email (when component mounts)
  useEffect(() => {
    // Only attempt to fill if we have an email and don't already have an address
    if (formData.email && (!formData.address || !formData.city)) {
      // In a real implementation, you would call an API to get address from email
      setTimeout(() => {
        if (!formData.address) {
          updateFormData("address", "");  // Removed dummy data
          updateFormData("city", "");     // Removed dummy data
          updateFormData("state", "");    // Removed dummy data
          updateFormData("zipcode", "");  // Removed dummy data
          setAddressDetected(true);
        }
      }, 500);
    }
  }, [formData.email]);

  // Validate zipcode when it changes
  useEffect(() => {
    if (formData.zipcode && zipTouched) {
      if (!validateZipcode(formData.zipcode)) {
        setErrors({...errors, zipcode: "Please enter a valid 5-digit zipcode"});
      } else {
        setErrors({...errors, zipcode: null});
      }
    }
  }, [formData.zipcode, zipTouched]);
  
  // Format zipcode as user types
  const handleZipcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 5);
    updateFormData("zipcode", value);
    setZipTouched(true);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Set all fields as touched for validation
    setZipTouched(true);
    
    // Check zipcode validity
    if (formData.zipcode && !validateZipcode(formData.zipcode)) {
      setErrors({...errors, zipcode: "Please enter a valid 5-digit zipcode"});
      return;
    }
    
    if (isFormValid) {
      nextStep();
    }
  };

  return (
    <>
      <Card className="mx-auto max-w-3xl shadow-sm border border-gray-200">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Enter Property Address</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Please provide the address of the property where service is needed
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            {/* Address Card Section */}
            <Card className="mb-8 border border-gray-200 bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      placeholder="Street address"
                      value={formData.address || ""}
                      onChange={(e) => updateFormData("address", e.target.value)}
                      className="w-full pl-10 bg-white"
                      required
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          document.getElementById("city").focus();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city || ""}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className="w-full bg-white"
                      required
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          document.getElementById("state").focus();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      id="state"
                      placeholder="State"
                      value={formData.state || ""} 
                      onChange={(e) => updateFormData("state", e.target.value)}
                      className="w-full bg-white" 
                      required
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          document.getElementById("zipcode").focus();
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zipcode <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="zipcode"
                    placeholder="5-digit zipcode"
                    value={formData.zipcode || ""}
                    onChange={handleZipcodeChange}
                    className={`w-full bg-white ${errors.zipcode ? "border-red-300" : ""}`}
                    required
                    maxLength={5}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && isFormValid) {
                        handleSubmit();
                      }
                    }}
                  />
                  {errors.zipcode && (
                    <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Toggle Button Cards */}
            <div className="space-y-6 mb-8">
              <Card className="border border-gray-200">
                <CardContent className="p-5">
                  <p className="text-sm font-medium mb-4">
                    Are you the owner of the house? <span className="text-red-500">*</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateFormData("isOwner", true)}
                      className={`flex-1 ${
                        formData.isOwner === true 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                      variant={formData.isOwner === true ? "default" : "outline"}
                      type="button"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => updateFormData("isOwner", false)}
                      className={`flex-1 ${
                        formData.isOwner === false 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                      variant={formData.isOwner === false ? "default" : "outline"}
                      type="button"
                    >
                      No
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200">
                <CardContent className="p-5">
                  <p className="text-sm font-medium mb-4">
                    Are you entitled to make changes to the house? <span className="text-red-500">*</span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateFormData("canMakeChanges", true)}
                      className={`flex-1 ${
                        formData.canMakeChanges === true 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                      variant={formData.canMakeChanges === true ? "default" : "outline"}
                      type="button"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => updateFormData("canMakeChanges", false)}
                      className={`flex-1 ${
                        formData.canMakeChanges === false 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                      variant={formData.canMakeChanges === false ? "default" : "outline"}
                      type="button"
                    >
                      No
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Get Free Quote button, centered */}
            <div className="flex justify-center">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="w-40 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Get Free Quote
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-6">
              <p className="mt-1">Your information is secure and confidential</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <TrustBadge />
    </>
  );
}
