import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StepProgressBar from "@/components/layout/step-progress-bar";

const electricBillOptions = [
  { id: "Under $100", name: "Under $100", questionText: "What is your average monthly electric bill?", answerText: "Under $100" },
  { id: "$100 - $200", name: "$100 - $200", questionText: "What is your average monthly electric bill?", answerText: "$100 - $200" },
  { id: "$200 - $300", name: "$200 - $300", questionText: "What is your average monthly electric bill?", answerText: "$200 - $300" },
  { id: "$300+", name: "$300+", questionText: "What is your average monthly electric bill?", answerText: "$300+" },
];

function SunExposureStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [selectedBill, setSelectedBill] = useState(formData.electricBill || null);

  const handleSelect = (typeId, questionText, answerText) => {
    setSelectedBill(typeId);
    updateFormData("electricBill", typeId);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: questionText, answer_text: answerText });
  };

  const handleNext = () => { if (selectedBill) nextStep(); };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">What is your average monthly electric bill?</h2>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {electricBillOptions.map((type, idx) => (
              <button key={type.id} type="button" onClick={() => handleSelect(type.id, type.questionText, type.answerText)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${idx !== electricBillOptions.length - 1 ? "border-b border-gray-200" : ""} ${selectedBill === type.id ? "bg-blue-50" : "bg-white"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedBill === type.id ? "border-blue-600" : "border-gray-300"}`}>
                  {selectedBill === type.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                </div>
                <span className={`font-medium text-base ${selectedBill === type.id ? "text-blue-600" : "text-gray-800"}`}>{type.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleNext} disabled={!selectedBill} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SunExposureStep;
