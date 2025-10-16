"use client";

import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { TrustBadge } from "@/components/steps/trust-badge";
import FooterSteps from "@/components/layout/footerSteps";

function EmailStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [isFocused, setIsFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  // Basic format validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  // Enhanced Gmail validation - checks if username looks realistic
  // Gmail usernames typically have letters and may have numbers and periods
  const isRealisticGmailUsername = (email) => {
    const username = email.split('@')[0];
    // Check if username contains at least one letter
    return /[a-zA-Z]/.test(username) && username.length >= 5;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const email = formData.email?.trim();
  if (!email) {
    setEmailError("Email is required");
    return;
  }
  if (!isValidEmail(email)) {
    setEmailError("Please enter a valid email");
    return;
  }

  setLoading(true);
  setEmailError("");

  try {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(
        `${apiUrl}/api/verify-email?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Backend error response:", text);
      throw new Error(`Backend error: ${response.status}`);
    }

    const result = await response.json();
    console.log("API Result:", result);

    // Check validation results
    if (result.format_valid && result.mx_found) {
      // Email is valid, proceed to next step
      nextStep();
    } else {
      setEmailError(result.message || "Invalid email address. Please enter a real email.");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    setEmailError("Unable to verify email. Try again later.");
  } finally {
    setLoading(false);
  }
};

  // Rest of your component remains the same
  return (
    <>
      <Card className="mx-auto max-w-3xl shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2">Please Enter Your Email</h2>
            <p className="text-muted-foreground text-sm">
              We'll send your estimate details to this address
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="email"
                  placeholder="yourname@example.com"
                  value={formData.email || ""}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full pl-10 ${isFocused ? 'ring-2 ring-blue-200 border-blue-300' : ''}`}
                  autoFocus
                />
              </div>
              {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
            </div>

            <input
              type="hidden"
              name="xxTrustedFormCertUrl"
              value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c"
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Verifying..." : "Next"}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 pt-2">
              Your information is secure and confidential
            </div>
          </form>
        </CardContent>
        <TrustBadge />
      </Card>
      <FooterSteps />
    </>
  );
}

export default EmailStep;
