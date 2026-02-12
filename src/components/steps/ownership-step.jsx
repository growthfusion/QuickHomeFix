import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const options = [
  { id: "yes", label: "Yes" },
  { id: "authorized", label: "No, but I'm authorized to make improvements" },
  { id: "no", label: "No" },
];

function OwnershipStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selected, setSelected] = useState(formData.isOwner || null);

  const handleSelect = (id) => {
    setSelected(id);
    updateFormData("isOwner", id);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: "Do you own this home?", answer_text: id });
  };

  const handleNext = () => {
    if (selected) nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Do you own this home?
            </h2>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {options.map((opt, idx) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  idx !== options.length - 1 ? "border-b border-gray-200" : ""
                } ${selected === opt.id ? "bg-blue-50" : "bg-white"}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === opt.id ? "border-blue-600" : "border-gray-300"
                }`}>
                  {selected === opt.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`font-medium text-base ${
                  selected === opt.id ? "text-blue-600" : "text-gray-800"
                }`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleNext}
              disabled={!selected}
              className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OwnershipStep;
