import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const sunExposureOptions = [
  { id: "Full Sun", name: "Full Sun", questionText: "How much sun exposure does your roof get?", answerText: "Full Sun" },
  { id: "Partial Shade", name: "Partial Shade", questionText: "How much sun exposure does your roof get?", answerText: "Partial Shade" },
  { id: "Mostly Shaded", name: "Mostly Shaded", questionText: "How much sun exposure does your roof get?", answerText: "Mostly Shaded" },
];

function SunExposureStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedExposure, setSelectedExposure] = useState(formData.sunExposure || null);

  const handleSelect = (typeId, questionText, answerText) => {
    setSelectedExposure(typeId);
    updateFormData("sunExposure", typeId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: questionText, answer_text: answerText });
  };

  const handleNext = () => { if (selectedExposure) nextStep(); };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">How much sun exposure does your roof get?</h2>
          </div>
          <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c" />
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {sunExposureOptions.map((type, idx) => (
              <button key={type.id} type="button" onClick={() => handleSelect(type.id, type.questionText, type.answerText)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${idx !== sunExposureOptions.length - 1 ? "border-b border-gray-200" : ""} ${selectedExposure === type.id ? "bg-blue-50" : "bg-white"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedExposure === type.id ? "border-blue-600" : "border-gray-300"}`}>
                  {selectedExposure === type.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <span className={`font-medium text-base ${selectedExposure === type.id ? "text-blue-600" : "text-gray-800"}`}>{type.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleNext} disabled={!selectedExposure} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SunExposureStep;
