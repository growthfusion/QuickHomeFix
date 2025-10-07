import React, { useState } from "react";

export default function CallSteps() {
  const [showContactStep, setShowContactStep] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      {!showContactStep ? (
        // ✅ STEP 1 - Completion Card
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm text-center animate-fade-in">
          <div className="text-green-500 text-5xl mb-3">✅</div>
          <h2 className="text-xl font-semibold mb-2">
            Thank You For Your Request!
          </h2>
          <p className="text-gray-600 mb-5 text-sm">
            Your roofing service estimate request has been submitted
            successfully. One of our specialists will contact you soon.
          </p>
          <button
            onClick={() => setShowContactStep(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Local Contractor No.
          </button>
        </div>
      ) : (
        // ✅ STEP 2 - Character + Speech Bubble + Dummy Number Card
        <div className="relative bg-white shadow-lg rounded-2xl p-6 w-full max-w-sm text-center animate-slide-up">
          {/* Cartoon Character */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png"
              alt="cartoon"
              className="w-20 h-20 rounded-full bg-gray-100 object-cover border-2 border-blue-300"
            />
          </div>

          <div className="mt-10">
            {/* Speech Bubble */}
            <div className="relative bg-blue-100 text-blue-800 p-3 rounded-lg mb-4 inline-block">
              <p className="text-sm font-medium">
                Hey! Want the contractor’s number to talk right away?
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-t-8 border-t-blue-100 border-x-8 border-x-transparent"></div>
            </div>

            {/* Dummy Phone Card */}
            <div className="bg-gray-100 rounded-xl p-3 text-center border border-gray-200">
              <p className="text-gray-800 text-lg font-semibold">
                📞 (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
