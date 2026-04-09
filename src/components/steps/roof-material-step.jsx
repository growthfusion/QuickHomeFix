import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const materials = [
  { id: "asphalt", name: "Asphalt", questionText: "What type of roofing material are you looking for?", answerText: "Asphalt" },
  { id: "metal", name: "Metal", questionText: "What type of roofing material are you looking for?", answerText: "Metal" },
  { id: "tile", name: "Tile", questionText: "What type of roofing material are you looking for?", answerText: "Tile" },
  { id: "slate", name: "Natural Slate", questionText: "What type of roofing material are you looking for?", answerText: "Natural Slate" },
  { id: "wood", name: "Cedar Shake", questionText: "What type of roofing material are you looking for?", answerText: "Cedar Shake" },
  { id: "composite", name: "Composite", questionText: "What type of roofing material are you looking for?", answerText: "Composite" },
  { id: "tar", name: "Tar/Torchdown", questionText: "What type of roofing material are you looking for?", answerText: "Tar/Torchdown" },
];

function RoofMaterialStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedMaterial, setSelectedMaterial] = useState(formData.material || null);

  const handleMaterialSelect = (materialId, questionText, answerText) => {
    setSelectedMaterial(materialId);
    updateFormData("material", materialId);
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              What type of roofing material are you looking for?
            </h2>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {materials.map((mat, idx) => (
              <button
                key={mat.id}
                type="button"
                onClick={() => handleMaterialSelect(mat.id, mat.questionText, mat.answerText)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                  idx !== materials.length - 1 ? "border-b border-gray-200" : ""
                } ${selectedMaterial === mat.id ? "bg-blue-50" : "bg-white"}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMaterial === mat.id ? "border-blue-600" : "border-gray-300"
                }`}>
                  {selectedMaterial === mat.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`font-medium text-base ${
                  selectedMaterial === mat.id ? "text-blue-600" : "text-gray-800"
                }`}>
                  {mat.name}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleNext}
              disabled={!selectedMaterial}
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

export default RoofMaterialStep;
