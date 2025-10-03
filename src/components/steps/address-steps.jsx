"use client";

import React, { useState, useCallback } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrustBadge } from "@/components/steps/trust-badge";
import { MapPin } from "lucide-react";
import axios from "axios";

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
  const [errors, setErrors] = useState({});
  const [zipTouched, setZipTouched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const validateZipcode = (zip) => /^\d{5}(-\d{4})?$/.test(zip);
  const isFormValid =
    formData.address &&
    formData.city &&
    formData.state &&
    formData.zipcode &&
    validateZipcode(formData.zipcode);

  // API call to get suggestions
  const fetchSuggestions = async (address, city, state, zipcode) => {
    if (!address && !city && !state && !zipcode) return;

    try {
      setLoading(true);
      const response = await axios.post(
        "https://api.addressverify.io/service/lookup/address",
        { address, city, state, zipcode },
        {
          headers: {
            "x-api-key": "5526148f-13e7-462f-9a4e-691ea3cc8eb8",
            "Content-Type": "application/json",
          },
        }
      );
      setLoading(false);

      if (response.data.suggestions && response.data.suggestions.length > 0) {
        // Directly show API suggestions
        setSuggestions(response.data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Address suggestion error:", err);
      setLoading(false);
      setSuggestions([]);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 500), []);

  const handleChange = (field) => (e) => {
    const value =
      field === "zipcode"
        ? e.target.value.replace(/\D/g, "").substring(0, 5)
        : e.target.value;

    updateFormData(field, value);
    if (field === "zipcode") setZipTouched(true);

    // Fetch live suggestions from API
    debouncedFetch(
      field === "address" ? value : formData.address,
      field === "city" ? value : formData.city,
      field === "state" ? value : formData.state,
      field === "zipcode" ? value : formData.zipcode
    );
  };

  const applySuggestion = (s) => {
    updateFormData("address", s.address);
    updateFormData("city", s.city);
    updateFormData("state", s.state);
    updateFormData("zipcode", s.zipcode);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setZipTouched(true);

    if (!validateZipcode(formData.zipcode)) {
      setErrors({
        ...errors,
        zipcode: "Please enter a valid 5-digit zipcode",
      });
      return;
    }

    if (isFormValid) nextStep();
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
            <form onSubmit={handleSubmit}>
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
                        onChange={handleChange("address")}
                        className="w-full pl-10 bg-white"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Suggestions dropdown */}
                    {loading && <p className="text-sm text-gray-500 mt-1">Loading suggestions...</p>}
                    {suggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-md mt-1">
                        {suggestions.map((s, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => applySuggestion(s)}
                          >
                            {s.address}, {s.city}, {s.state} {s.zipcode}
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
                        onChange={handleChange("city")}
                        className="w-full bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state || ""}
                        onChange={handleChange("state")}
                        className="w-full bg-white"
                        required
                      />
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
                      onChange={handleChange("zipcode")}
                      className={`w-full bg-white ${errors.zipcode ? "border-red-300" : ""}`}
                      required
                      maxLength={5}
                    />
                    {errors.zipcode && (
                      <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit button */}
              <div className="grid grid-cols-1 gap-2 mt-2">
                <Button
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Get Free Quote
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
