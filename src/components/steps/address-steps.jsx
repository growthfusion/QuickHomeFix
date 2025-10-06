"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge } from "@/components/steps/trust-badge";
import { MapPin, Check, Loader2 } from "lucide-react";
import TFConsent from "@/components/TF/TFConsent";

// Debounce helper
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export function AddressSteps() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addressValid, setAddressValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [zipTouched, setZipTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validateZipcode = (zip) => /^\d+$/.test(zip);
  
  // Check form validity whenever fields change
  useEffect(() => {
    const valid = 
      formData.address && 
      formData.city && 
      formData.state && 
      formData.zipcode && 
      validateZipcode(formData.zipcode);
    
    setAddressValid(valid);
  }, [formData.address, formData.city, formData.state, formData.zipcode]);

  // Fetch suggestions from backend
  const fetchSuggestions = async (input) => {
    if (!input) return setSuggestions([]);
    try {
      setLoading(true);
     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/places/autocomplete?input=${encodeURIComponent(input)}`);

      const data = await res.json();
      setSuggestions(data.predictions || []);
    } catch (err) {
      console.error("Google suggestion error:", err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 400), []);

  const handleChange = (e) => {
    const value = e.target.value;
    updateFormData("address", value);
    debouncedFetch(value);
  };

  const handleZipcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 5);
    updateFormData("zipcode", value);
    setZipTouched(true);
    if (errors.zipcode) {
      setErrors({ ...errors, zipcode: null });
    }
  };

  const applySuggestion = async (s) => {
    setLoading(true);
    updateFormData("address", s.description);
    setSuggestions([]);

    // Fetch details from backend
    if (!s.place_id) {
      setLoading(false);
      return;
    }

    try {
     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/places/details?place_id=${s.place_id}`);

      const data = await res.json();

      // Auto-fill all address components
      if (data.street) updateFormData("address", data.street);
      if (data.city) updateFormData("city", data.city);
      if (data.state) updateFormData("state", data.state);
      if (data.zipcode) updateFormData("zipcode", data.zipcode);
    } catch (err) {
      console.error("Details fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setZipTouched(true);
    setSubmitting(true);
    
    // Validate all fields explicitly
    let hasErrors = false;
    const newErrors = {};
    
    if (!formData.address) {
      hasErrors = true;
      newErrors.address = "Address is required";
    }
    
    if (!formData.city) {
      hasErrors = true;
      newErrors.city = "City is required";
    }
    
    if (!formData.state) {
      hasErrors = true;
      newErrors.state = "State is required";
    }
    
    if (!formData.zipcode) {
      hasErrors = true;
      newErrors.zipcode = "Zipcode is required";
    } else if (!validateZipcode(formData.zipcode)) {
      hasErrors = true;
      newErrors.zipcode = "Please enter a valid 5-digit zipcode";
    }
    
    setErrors(newErrors);
    
    if (hasErrors) {
      console.log("Form has errors:", newErrors);
      setSubmitting(false);
      return;
    }
    
    // If we get here, the form is valid - proceed to next step
    console.log("Form is valid, proceeding to next step");
    nextStep();
    setSubmitting(false);
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

          <div className="max-w-2xl mx-auto relative">
            <form data-tf-element-role="offer" onSubmit={handleSubmit} noValidate>
              <Card className="mb-8 border border-gray-200 bg-gray-50 dark:bg-gray-800">
                <CardContent className="p-6 space-y-4">
                  {/* Address Input */}
                  <div className="relative">
                    <label htmlFor="address" className="block text-sm font-medium mb-2">
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
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 bg-white ${
                          errors.address 
                            ? "border-red-300" 
                            : addressValid 
                              ? 'border-green-500' 
                              : ''
                        }`}
                        required
                        autoFocus
                        autoComplete="off"
                      />
                      {addressValid && !errors.address && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}

                    {loading && <p className="text-sm text-gray-500 mt-1">Loading suggestions...</p>}
                    {suggestions.length > 0 && !loading && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-md mt-1 max-h-60 overflow-auto">
                        {suggestions.map((s, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => applySuggestion(s)}
                          >
                            {s.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city || ""}
                        onChange={(e) => updateFormData("city", e.target.value)}
                        className={`w-full bg-white ${
                          errors.city 
                            ? "border-red-300" 
                            : addressValid 
                              ? 'border-green-500' 
                              : ''
                        }`}
                        required
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state || ""}
                        onChange={(e) => updateFormData("state", e.target.value)}
                        className={`w-full bg-white ${
                          errors.state 
                            ? "border-red-300" 
                            : addressValid 
                              ? 'border-green-500' 
                              : ''
                        }`}
                        required
                      />
                      {errors.state && (
                        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Zipcode */}
                  <div className="mt-4">
                    <label htmlFor="zipcode" className="block text-sm font-medium mb-2">
                      Zipcode <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="zipcode"
                      placeholder="5-digit zipcode"
                      value={formData.zipcode || ""}
                      onChange={handleZipcodeChange}
                      className={`w-full bg-white ${
                        errors.zipcode 
                          ? "border-red-300" 
                          : addressValid 
                            ? 'border-green-500' 
                            : ''
                      }`}
                      required
                      maxLength={5}
                    />
                    {errors.zipcode && (
                      <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Hidden TrustedForm field */}
              <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl"
                     value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c"
              />
              
              {/* Consent block */}
              <TFConsent submitText="Get Free Quote" />

              {/* Submit button */}
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`w-full ${addressValid ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  size="sm"
                  data-tf-element-role="submit"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : addressValid ? (
                    "Get Free Quote"
                  ) : (
                    "Get Free Quote"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <TrustBadge />
    </>
  );
}
