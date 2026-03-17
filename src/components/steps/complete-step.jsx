import React from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Shield, Clock, UserCheck, Star } from "lucide-react";

import imgRoofing from "@/assets/images/roofing_services.webp";
import imgSolar from "@/assets/images/Solar.webp";
import imgWindow from "@/assets/images/window_services.webp";
import imgGutter from "@/assets/images/gutter_services.webp";
import imgBath from "@/assets/images/walkin_tub_services.png";
import imgShower from "@/assets/images/walkin_shower_services.png";

function StatusBadge({ status }) {
  const colors = {
    success: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    error: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "unknown"}
    </span>
  );
}

function JsonBlock({ label, data }) {
  if (!data) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <pre className="bg-gray-900 text-green-300 text-[11px] rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
        {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function LeadResponsePanel({ response }) {
  const pd = response?.partnerDelivery || {};
  const pingResponse = pd.pingResponse || null;
  const postResponse = pd.postResponse || null;
  const pingPayload = pd.sentPayloads?.pingPayload || pd.pingPayload || null;
  const postPayload = pd.sentPayloads?.postPayload || pd.postPayload || null;
  const pingAccepted = Boolean(pd.pingToken || pingResponse?.status === "success");

  return (
    <Card className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
      <CardContent className="p-5 sm:p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          API Response Details
        </h3>

        {response.id && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <span className="font-medium text-gray-700">Lead ID:</span>
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{response.id}</code>
          </div>
        )}

        {/* Ping Section */}
        <div className="border border-gray-100 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">1. Ping Response</span>
            {pingResponse && <StatusBadge status={pingResponse.status} />}
          </div>
          {pingResponse ? (
            <div className="space-y-1 text-xs text-gray-600">
              {pingResponse.pingToken && (
                <p><span className="font-medium">Ping Token:</span>{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] break-all">{pingResponse.pingToken}</code>
                </p>
              )}
              {pingResponse.price && <p><span className="font-medium">Price:</span> ${pingResponse.price}</p>}
              {pingResponse.message && <p><span className="font-medium">Message:</span> {pingResponse.message}</p>}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No ping response received</p>
          )}
          <JsonBlock label="Ping Payload Sent" data={pingPayload} />
        </div>

        {/* Post Section */}
        {pingAccepted && (
          <div className="border border-gray-100 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">2. Post Response</span>
              {postResponse && <StatusBadge status={postResponse.status} />}
            </div>
            {postResponse ? (
              <div className="space-y-1 text-xs text-gray-600">
                {postResponse.leadId && (
                  <p><span className="font-medium">Lead ID:</span>{" "}
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">{postResponse.leadId}</code>
                  </p>
                )}
                {postResponse.message && <p><span className="font-medium">Message:</span> {postResponse.message}</p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No post response received</p>
            )}
            <JsonBlock label="Post Payload Sent" data={postPayload} />
          </div>
        )}

        {/* Error/Rejected Section */}
        {!pingAccepted && pd.enabled && (
          <div className="border border-red-100 rounded-lg p-3 mb-3 bg-red-50">
            <p className="text-xs font-bold text-red-700 mb-2">Partner Error</p>
            <div className="space-y-1 text-xs text-red-600">
              {pd.error && <p><span className="font-medium">Error:</span> {pd.error}</p>}
              {pd.status && <p><span className="font-medium">Status:</span> {pd.status}</p>}
              {pd.reason && <p><span className="font-medium">Reason:</span> {pd.reason}</p>}
              {pd.message && <p><span className="font-medium">Message:</span> {pd.message}</p>}
            </div>
            <JsonBlock label="Partner Response" data={pd.partnerResponse} />
            <JsonBlock label="Partner Request" data={pd.partnerRequest || pd.pingPayload} />
          </div>
        )}

        {/* Skipped / Duplicate */}
        {pd.skipped && (
          <div className="border border-yellow-100 rounded-lg p-3 bg-yellow-50">
            <p className="text-xs font-semibold text-yellow-700">
              {pd.reason === "DUPLICATE_SUPPRESSED" ? "Duplicate lead suppressed" :
               pd.reason === "PARTNER_DUPLICATE" ? "Partner duplicate detected" :
               pd.enabled === false ? "LeadPost not enabled" : "Lead delivery skipped"}
            </p>
            {pd.message && <p className="text-xs text-yellow-600 mt-1">{pd.message}</p>}
          </div>
        )}

        {/* Full Raw Response (collapsible) */}
        <details className="mt-4">
          <summary className="text-xs font-medium text-gray-400 cursor-pointer hover:text-gray-600">
            View Full Raw Response
          </summary>
          <pre className="bg-gray-900 text-gray-300 text-[10px] rounded-lg p-3 mt-2 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
            {JSON.stringify(response, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

export default function CompleteStep() {
  const { formData, resetAll, leadResponse } = useFormStore();
  const navigate = useNavigate();

  const getServiceMessage = () => {
    const serviceMap = {
      windows: { label: "window", specialist: "window" },
      solar: { label: "solar energy", specialist: "solar" },
      bath: { label: "bath remodeling", specialist: "remodeling" },
      gutter: { label: "gutter service", specialist: "gutter" },
      "walk-in": { label: "walk-in tub/shower", specialist: "bathroom" },
      shower: { label: "walk-in shower", specialist: "bathroom" },
    };
    const s = serviceMap[formData.service] || { label: "roofing", specialist: "roofing" };
    return {
      title: "Thank You!",
      subtitle: "Your request has been submitted successfully.",
      message: `A ${s.specialist} specialist will review your ${s.label} project and contact you within 24 hours with a free, no-obligation quote.`,
    };
  };

  const getServiceCards = () => {
    const serviceDetails = {
      roofing: { name: "Roofing", image: imgRoofing, description: "Premium roofing solutions for any home", path: "/get-quotes/roof" },
      solar: { name: "Solar Energy", image: imgSolar, description: "Save on energy costs with clean solar power", path: "/get-quotes/solar" },
      windows: { name: "Windows", image: imgWindow, description: "Modern windows that improve comfort", path: "/get-quotes/windows" },
      gutter: { name: "Gutters", image: imgGutter, description: "Quality gutter systems to protect your home", path: "/get-quotes/gutter" },
      bath: { name: "Bath Remodeling", image: imgBath, description: "Modern bathroom renovations for comfort", path: "/get-quotes/bath" },
      shower: { name: "Walk-in Shower", image: imgShower, description: "Modern, accessible shower solutions", path: "/get-quotes/shower" },
    };
    const allKeys = Object.keys(serviceDetails);
    const canonical = allKeys.includes(formData.service) ? formData.service : "roofing";
    return allKeys.filter((k) => k !== canonical).slice(0, 5).map((id) => ({ id, ...serviceDetails[id] }));
  };

  const { title, subtitle, message } = getServiceMessage();
  const serviceCards = getServiceCards();

  const handleGoHome = () => {
    resetAll();
    navigate("/");
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-4 sm:py-12">
      {/* Success Card */}
      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-8 sm:p-10 text-center">
          {/* Animated checkmark */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center animate-success">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-green-600 font-semibold text-sm mb-4">{subtitle}</p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">What Happens Next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Review within 24 hours</p>
                  <p className="text-xs text-gray-400">Our team will review your project details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Matched with top professionals</p>
                  <p className="text-xs text-gray-400">We connect you with vetted local contractors</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Get your free quotes</p>
                  <p className="text-xs text-gray-400">Compare prices and choose the best offer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure & Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 100% Free</span>
          </div>

          <button
            onClick={handleGoHome}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </CardContent>
      </Card>

      {leadResponse && <LeadResponsePanel response={leadResponse} />}

      {/* Other Services */}
      <div className="w-full max-w-2xl">
        <h3 className="text-base font-semibold text-gray-900 text-center mb-5">Explore Other Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {serviceCards.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { resetAll(); navigate(service.path); }}>
              <img src={service.image} alt={service.name} className="w-full h-28 sm:h-36 object-cover" loading="lazy" decoding="async" />
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-800 mb-1">{service.name}</h4>
                <p className="text-gray-400 text-xs leading-relaxed hidden sm:block mb-2">{service.description}</p>
                <button className="bg-orange-400 hover:bg-orange-500 text-white w-full font-medium py-1.5 px-2 rounded-full text-xs transition-colors"
                  onClick={(e) => { e.stopPropagation(); resetAll(); navigate(service.path); }}>Get Quote</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
