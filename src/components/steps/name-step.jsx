import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { TrustBadge } from '@/components/steps/trust-badge ';

function NameStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [focusedField, setFocusedField] = useState(null);
  
  const isFormValid = formData.firstName && formData.lastName;

  return (
    <>
    <Card className="mx-auto max-w-3xl shadow-sm border border-gray-200">
      <CardContent className="p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Enter Your Name</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Please provide your full name for your estimate
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {/* Name Card Section */}
          <Card className="mb-8 border border-gray-200 bg-gray-50 dark:bg-gray-800">
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <Input
                  placeholder="Enter your first name"
                  value={formData.firstName || ""}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full bg-white ${
                    focusedField === "firstName" ? "ring-2 ring-blue-100 border-blue-300" : ""
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <Input
                  placeholder="Enter your last name"
                  value={formData.lastName || ""}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full bg-white ${
                    focusedField === "lastName" ? "ring-2 ring-blue-100 border-blue-300" : ""
                  }`}
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

export default NameStep;
