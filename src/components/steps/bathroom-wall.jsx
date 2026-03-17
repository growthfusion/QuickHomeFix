import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const bathwallTypes = [
  { id: "Add Walls", name: "Add Walls", questionText: "Do you want to add or remove Bathroom Walls?", answerText: "Add Walls" },
  { id: "Remove Walls", name: "Remove Walls", questionText: "Do you want to add or remove Bathroom Walls?", answerText: "Remove Walls" },
  { id: "nochange", name: "No Change", questionText: "Do you want to add or remove Bathroom Walls?", answerText: "nochange" },
];

function BathwallTypeStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedType, setSelectedType] = useState(formData.bathwallType || null);

  const handleTypeSelect = (typeId, questionText, answerText) => {
    setSelectedType(typeId);
    updateFormData("bathwallType", typeId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: questionText, answer_text: answerText });
  };

  const handleNext = () => {
    if (selectedType) nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Do you want to add or remove Bathroom Walls?</h2>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {bathwallTypes.map((type, idx) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeSelect(type.id, type.questionText, type.answerText)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  idx !== bathwallTypes.length - 1 ? "border-b border-gray-200" : ""
                } ${selectedType === type.id ? "bg-blue-50" : "bg-white"}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedType === type.id ? "border-blue-600" : "border-gray-300"
                }`}>
                  {selectedType === type.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <span className={`font-medium text-base ${selectedType === type.id ? "text-blue-600" : "text-gray-800"}`}>{type.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleNext} disabled={!selectedType} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BathwallTypeStep;
