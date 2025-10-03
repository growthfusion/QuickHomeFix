"use client";
import React from "react";

/** Use on steps that collect PII (email/phone/name/address). */
export default function TFConsent({ submitText = "Submit", required = true }) {
    return (
        <div className="mb-6 text-xs text-gray-600 space-y-2">
            <label className="inline-flex items-start gap-2" data-tf-element-role="consent-language">
                <input
                    type="checkbox"
                    className="mt-0.5"
                    data-tf-element-role="consent-opt-in"
                    required={required}
                />
                <span>
          By clicking <span data-tf-element-role="submit-text">{submitText}</span>, I agree to be
          contacted about relevant offers at the number and email I provide. This may include calls,
          texts, or emails from our partners. I understand consent isn’t required to make a purchase.
        </span>
            </label>
        </div>
    );
}
