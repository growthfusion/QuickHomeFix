import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function MarketingPartners() {
  const partners = [
    "West Shore Home",
    "Modernize",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Matched companies included but not limited to:
        </h2>

        <ul className="list-disc list-inside space-y-1.5">
          {partners.map((name) => (
            <li key={name} className="text-sm text-gray-700">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MarketingPartners;
