import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const materials = [
  { id: "Single Hung", name: "Single Hung", questionText: "Select Window Style", answerText: "Single Hung" },
  { id: "Double Hung", name: "Double Hung", questionText: "Select Window Style", answerText: "Double Hung" },
  { id: "Casement", name: "Casement", questionText: "Select Window Style", answerText: "Casement" },
  { id: "Bay/Bow", name: "Bay/Bow", questionText: "Select Window Style", answerText: "Bay/Bow" },
  { id: "Other", name: "Other", questionText: "Select Window Style", answerText: "Other" },
  { id: "Sliding", name: "Sliding", questionText: "Select Window Style", answerText: "Sliding" },
];

function WindowStyleStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedMaterial, setSelectedMaterial] = useState(formData.windowStyle || null);

  const handleMaterialSelect = (materialId, questionText, answerText) => {
    setSelectedMaterial(materialId);
    updateFormData("windowStyle", materialId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: questionText, answer_text: answerText });
  };

  const handleNext = () => {
    if (selectedMaterial) nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Window Style</h2>
          </div>
          <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c" />
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {materials.map((material, idx) => (
              <button
                key={material.id}
                type="button"
                onClick={() => handleMaterialSelect(material.id, material.questionText, material.answerText)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  idx !== materials.length - 1 ? "border-b border-gray-200" : ""
                } ${selectedMaterial === material.id ? "bg-blue-50" : "bg-white"}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMaterial === material.id ? "border-blue-600" : "border-gray-300"
                }`}>
                  {selectedMaterial === material.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <span className={`font-medium text-base ${selectedMaterial === material.id ? "text-blue-600" : "text-gray-800"}`}>{material.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleNext} disabled={!selectedMaterial} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WindowStyleStep;
