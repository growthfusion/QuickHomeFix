import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { TrustBadge } from '@/components/steps/trust-badge ';


function EmailStep() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const [isFocused, setIsFocused] = useState(false);

  // Simple email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const isEmailValid = formData.email && isValidEmail(formData.email);

  return (
    <>
    <Card className="mx-auto max-w-2xl shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">Please Enter Your Email</h2>
          <p className="text-muted-foreground text-sm">
            We'll send your estimate details to this address
          </p>
        </div>
        
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="email"
                placeholder="yourname@example.com"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full pl-10 ${isFocused ? 'ring-2 ring-blue-200 border-blue-300' : ''}`}
              />
            </div>
            {formData.email && !isEmailValid && (
              <p className="mt-1 text-sm text-red-500">Please enter a valid email</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              onClick={prevStep}
              variant="outline"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-black border-gray-300"
            >
              Back
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!isEmailValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500 pt-2">
            Your information is secure and confidential
          </div>
        </div>
      </CardContent>
    </Card>
       <TrustBadge />
    </>
  );
}

export default EmailStep;
