import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";

function EmailStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const pushEmailEvent = (email) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "email", question_text: "Please Enter Your Email", answer_text: email, email_domain: (email.split("@")[1] || "").toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.email?.trim();
    if (!email) { setEmailError("Email is required"); return; }
    if (!isValidEmail(email)) { setEmailError("Please enter a valid email"); return; }

    setLoading(true);
    setEmailError("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`${apiBase}/api/verify-email?email=${encodeURIComponent(email)}`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const result = await response.json();

      if (result.format_valid === false) {
        setEmailError(result.message || "Invalid email format. Please check your email.");
      } else {
        // format_valid is true — proceed even if mx_found is false (API may be unreliable for some domains)
        pushEmailEvent(email);
        nextStep();
      }
    } catch (error) {
      console.warn("Email API unavailable, using client-side validation:", error.message);
      // Client-side validation already passed — proceed
      pushEmailEvent(email);
      nextStep();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Please Enter Your Email</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input type="email" placeholder="yourname@example.com" value={formData.email || ""}
                  onChange={(e) => updateFormData("email", e.target.value)} className="w-full pl-10" autoFocus />
              </div>
              {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={loading} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full">
                {loading ? <><span className="btn-spinner mr-2" />Verifying...</> : "Next"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailStep;
