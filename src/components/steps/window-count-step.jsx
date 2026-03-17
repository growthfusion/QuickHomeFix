import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const countOptions = [
  { label: "6+", value: "6-9" },
  { label: "3-5", value: "3-5" },
  { label: "2", value: "2" },
  { label: "1", value: "1" },
];

const normalizeWindowCount = (value) => (value === "6+" ? "6-9" : value);

function WindowCountStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedCount, setSelectedCount] = useState(
    normalizeWindowCount(formData.windowCount || null)
  );

  const handleCountSelect = (option) => {
    setSelectedCount(option.value);
    updateFormData("windowCount", option.value);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: "How many windows are involved?", answer_text: option.label });
  };

  const handleNext = () => { if (selectedCount) nextStep(); };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">How many windows are involved?</h2>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {countOptions.map((opt, idx) => (
              <button key={opt.value} type="button" onClick={() => handleCountSelect(opt)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${idx !== countOptions.length - 1 ? "border-b border-gray-200" : ""} ${selectedCount === opt.value ? "bg-blue-50" : "bg-white"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedCount === opt.value ? "border-blue-600" : "border-gray-300"}`}>
                  {selectedCount === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <span className={`font-medium text-base ${selectedCount === opt.value ? "text-blue-600" : "text-gray-800"}`}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleNext} disabled={!selectedCount} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WindowCountStep;
