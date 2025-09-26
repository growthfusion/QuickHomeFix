import React, { useEffect, useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { TrustBadge } from '@/components/steps/trust-badge ';


export function AddressSteps() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [addressDetected, setAddressDetected] = useState(false);
  
  const isFormValid = formData.address && formData.city && formData.zipcode;

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
                <label className="block text-sm font-medium mb-2">Property Address</label>
                <Input
                  placeholder="Street address"
                  value={formData.address || ""}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    placeholder="City"
                    value={formData.city || ""}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Input 
                    placeholder="State"
                    value={formData.state || ""} 
                    onChange={(e) => updateFormData("state", e.target.value)}
                    className="w-full bg-white" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Zipcode</label>
                <Input
                  placeholder="Zipcode"
                  value={formData.zipcode || ""}
                  onChange={(e) => updateFormData("zipcode", e.target.value)}
                  className="w-full bg-white"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Navigation buttons - Back and Next */}
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
                disabled={!isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Next
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
