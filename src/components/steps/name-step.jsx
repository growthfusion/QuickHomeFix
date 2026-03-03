import React from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StepProgressBar from "@/components/layout/step-progress-bar";

function NameStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const isFormValid = formData.firstName && formData.lastName;

  const pushFormEvent = (question, answer) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: question, answer_text: answer });
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;
    pushFormEvent("Enter Your First Name", formData.firstName || "");
    pushFormEvent("Enter Your Last Name", formData.lastName || "");
    nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Enter Your Name</h2>
          </div>

          <form data-tf-element-role="offer" onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input id="firstName" placeholder="First name" value={formData.firstName || ""}
                  onChange={(e) => updateFormData("firstName", e.target.value)} className="w-full" required autoFocus />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input id="lastName" placeholder="Last name" value={formData.lastName || ""}
                  onChange={(e) => updateFormData("lastName", e.target.value)} className="w-full" required />
              </div>
            </div>

            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c" />

            <div className="flex justify-center">
              <Button type="submit" disabled={!isFormValid} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50" data-tf-element-role="submit">Next</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NameStep;
