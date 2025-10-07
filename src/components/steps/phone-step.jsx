"use client"

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { TrustBadge } from '@/components/steps/trust-badge';
import FooterSteps from '@/components/layout/footerSteps'


function PhoneStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [isFocused, setIsFocused] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  
  // Format phone number as user types (XXX) XXX-XXXX
  const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      let formatted = '';
      if (match[1]) {
        formatted = `(${match[1]}`;
        if (match[1].length === 3) {
          formatted += ') ';
        }
      }
      if (match[2]) {
        formatted += match[2];
        if (match[2].length === 3) {
          formatted += '-';
        }
      }
      if (match[3]) {
        formatted += match[3];
      }
      return formatted;
    }
    return phoneNumberString;
  };

  // Validate phone number pattern
  const validatePhone = (phone) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone)) return "Please enter a complete 10-digit phone number";
    return "";
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    updateFormData("phone", formattedPhone);
  };

  // Check validation on change
  useEffect(() => {
    if (formData.phone) {
      setPhoneError(validatePhone(formData.phone));
    } else {
      setPhoneError("");
    }
  }, [formData.phone]);
  
  const isPhoneValid = formData.phone && !phoneError;
  
  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const error = validatePhone(formData.phone || "");
    setPhoneError(error);
    
    if (!error) {
      nextStep();
    }
  };

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
            <form data-tf-element-role="offer" onSubmit={handleSubmit}>
              {/* Phone Card Section */}
              <Card className="mb-8 border border-gray-200 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-6">
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={formData.phone || ""}
                      onChange={handlePhoneChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className={`w-full pl-10 bg-white ${
                        isFocused ? "ring-2 ring-blue-100 border-blue-300" : ""
                      } ${phoneError && formData.phone ? "border-red-300" : ""}`}
                      maxLength={14}
                      required
                      autoFocus // Automatically focus this field on load
                    />
                  </div>
                  {phoneError && formData.phone && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
                </CardContent>
              </Card>

              {/* Hidden TrustedForm field */}
              <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl"
                     value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c"
              />
              
              {/* Next button */}
              <div className="grid grid-cols-1 gap-2">
                <div className="col-span-1">
                  <Button
                    type="submit"
                    disabled={!isPhoneValid}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    data-tf-element-role="submit"
                  >
                    Next
                  </Button>
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-500 mt-6">
                <p className="mt-1">Your information is secure and confidential</p>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <TrustBadge />
        <FooterSteps />
    </>
  );
}

export default PhoneStep;
