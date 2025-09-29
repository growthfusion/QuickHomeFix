"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge } from '@/components/steps/trust-badge ';
import { MapPin } from "lucide-react";

export function AddressSteps() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [addressDetected, setAddressDetected] = useState(false);
  const [errors, setErrors] = useState({});
  const [zipTouched, setZipTouched] = useState(false);

  const tfLoadedRef = useRef(false);
  
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
                     validateZipcode(formData.zipcode);

  // Simulate auto-filling address from email (when component mounts)
  useEffect(() => {
    if (formData.email && (!formData.address || !formData.city)) {
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

  useEffect(() => {
    if (tfLoadedRef.current) return;
    tfLoadedRef.current = true;

    const tf = document.createElement("script");
    tf.type = "text/javascript";
    tf.async = true;
    // NOTE: keep the field name exactly as shown so the SDK fills the hidden input.
    tf.src =
        (document.location.protocol === "https:" ? "https" : "http") +
        "://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl" +
        "&use_tagged_consent=true&l=" +
        (new Date().getTime() + Math.random());

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(tf, firstScript);

    // Optional: basic debug so you can confirm it loaded
    tf.addEventListener("load", () => {
      // console.log("TrustedForm script loaded");
    });

  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault?.();

    setZipTouched(true);

    if (formData.zipcode && !validateZipcode(formData.zipcode)) {
      setErrors({ ...errors, zipcode: "Please enter a valid 5-digit zipcode" });
      return;
    }

    // (Optional) For testing: read the hidden field so you can verify it
    const certEl = document.querySelector('input[name="xxTrustedFormCertUrl"]');
    const certUrl = certEl?.value || "";

    if (isFormValid) nextStep();
  };

  return (
      <>
        {/* data-tf-element-role="offer" groups the consent context on the page */}
        <form data-tf-element-role="offer" onSubmit={handleSubmit}>
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
                            id="address"
                            placeholder="Street address"
                            value={formData.address || ""}
                            onChange={(e) => updateFormData("address", e.target.value)}
                            className="w-full pl-10 bg-white"
                            required
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
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
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && isFormValid) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                      />
                      {errors.zipcode && (
                          <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* CONSENT (tagged for TrustedForm) */}
                <div className="mb-6 text-xs text-gray-600 space-y-2">
                  <label className="inline-flex items-start gap-2" data-tf-element-role="consent-language">
                    <input
                        type="checkbox"
                        required
                        data-tf-element-role="consent-opt-in"
                        className="mt-0.5"
                    />
                    <span>
                    By clicking <span data-tf-element-role="submit-text">Get Free Quote</span>, I agree
                    to be contacted about insurance offers at the number and email I provide.
                    This may include calls, texts, or emails from our partners. I understand
                    consent isn’t required to make a purchase.
                  </span>
                  </label>
                </div>

                {/* Hidden field that TrustedForm will populate */}
                <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" />

                {/* Navigation button - Get Free Quote */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="col-span-1">
                    <Button
                        type="submit"
                        disabled={!isFormValid}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        data-tf-element-role="submit"
                    >
                      Get Free Quote
                    </Button>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500 mt-6">
                  <p>Your information is secure and confidential</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <TrustBadge />
      </>
  );
}
