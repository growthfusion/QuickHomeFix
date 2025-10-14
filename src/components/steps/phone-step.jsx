"use client";

import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { TrustBadge } from "@/components/steps/trust-badge";
import FooterSteps from "@/components/layout/footerSteps";

function PhoneStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [isFocused, setIsFocused] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (match) {
      let formatted = "";
      if (match[1]) {
        formatted = `(${match[1]}`;
        if (match[1].length === 3) formatted += ") ";
      }
      if (match[2]) {
        formatted += match[2];
        if (match[2].length === 3) formatted += "-";
      }
      if (match[3]) formatted += match[3];
      return formatted;
    }
    return phoneNumberString;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone))
      return "Please enter a complete 10-digit phone number";
    return "";
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    updateFormData("phone", formattedPhone);
  };

  useEffect(() => {
    if (formData.phone) {
      setPhoneError(validatePhone(formData.phone));
    } else {
      setPhoneError("");
    }
  }, [formData.phone]);

  const isPhoneValid = formData.phone && !phoneError;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const error = validatePhone(formData.phone || "");
    setPhoneError(error);

    if (error) return;

    setLoading(true);

    try {
      // Using backend proxy to hide API key
      const cleanedNumber = formData.phone.replace(/\D/g, "");
      
      const response = await fetch(
        `http://localhost:5000/verify-phone?phone=${cleanedNumber}`
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("Backend error:", text);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Phone verification result:", result);

      if (result.valid && result.country_code === "US") {
        nextStep();
      } else if (!result.valid) {
        setPhoneError("Please enter a valid phone number.");
      } else if (result.country_code !== "US") {
        setPhoneError("Please enter a US phone number.");
      } else {
        setPhoneError("Phone verification failed. Please check your number.");
      }
    } catch (error) {
      console.error("Error verifying phone:", error);
      
      // If API fails but the phone format is valid, allow to continue
      if (isPhoneValid) {
        console.log("API verification failed, but phone format is valid. Proceeding anyway.");
        nextStep();
      } else {
        setPhoneError("Unable to verify phone number. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="mx-auto max-w-3xl shadow-sm border border-gray-200">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-3">
              Enter Your Phone Number
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This is the last step! When you provide your phone number, you'll
              receive a quote from a trusted home service provider.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
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
                    />
                  </div>

                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={!isPhoneValid || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {loading ? "Verifying..." : "Next"}
              </Button>
            </form>
          </div>
        </CardContent>
        <TrustBadge />
      </Card>
      <FooterSteps />
    </>
  );
}

export default PhoneStep;
