import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo1 from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";
import "@/index.css";
import HeroSection from "@/components/layout/HeroSection";
import { useFormStore } from "@/lib/store";
import { CheckCircle2, Mail, MapPin, Sun, AppWindow, Droplets, ShowerHead, Bath, Hammer } from "lucide-react";
import roofIcon from "@/assets/images/12085683_20944179.svg";
import solarIcon from "@/assets/images/21585719_Na_Nov_23.svg";
import windowIcon from "@/assets/images/10613460_10144.svg";
import bathIcon from "@/assets/images/12291237_Plumber repairing pipe burst.svg";
import gutterIcon from "@/assets/images/12469188_Wavy_Park-02_Single-01.jpg";
import showerIcon from "@/assets/images/45256249_plumbers_clearing_blockage_in_toilet_with_plunger.jpg";
import tubIcon from "@/assets/images/23591705_cleaning_v_03.jpg";

const SERVICES = [
  { title: "Roofing", image: roofIcon, link: "/get-quotes/roof" },
  { title: "Solar", image: solarIcon, link: "/get-quotes/solar" },
  { title: "Window\nReplacement", image: windowIcon, link: "/get-quotes/windows" },
  { title: "Bath\nRemodeling", image: bathIcon, link: "/get-quotes/bath" },
  { title: "Gutters", image: gutterIcon, link: "/get-quotes/gutter" },
  { title: "Walk-In\nShowers", image: showerIcon, link: "/get-quotes/shower" },
  { title: "Walk-In\nTubs", image: tubIcon, link: "/get-quotes/tub" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Pick Your Service", desc: "Select the service you need." },
  { step: "02", title: "Answer a Few Questions", desc: "Tell us about your service." },
  { step: "03", title: "Get Matched", desc: "Connect with top-rated local pros." },
];

function Home() {
  const navigate = useNavigate();
  const initForm = useFormStore((state) => state.initForm);
  const goToQuotes = (path) => navigate(path || "/get-quotes");

  useEffect(() => { initForm(); }, [initForm]);

  return (
    <div className="text-gray-700 overflow-x-hidden">

      {/* Hero (header is inside) */}
      <HeroSection />

      {/* Services */}
      <section id="services" className="py-12 lg:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">
            Our Premium Services
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div
                  key={i}
                  onClick={() => goToQuotes(svc.link)}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col items-center text-center cursor-pointer card-smooth"
                >
                  <div className="flex items-center justify-center mb-2">
                    {svc.image ? (
                      <img src={svc.image} alt={svc.title} className="w-full h-32 sm:h-36 object-contain" loading="lazy" decoding="async" />
                    ) : (
                      <Icon className="w-24 h-24 sm:w-28 sm:h-28 text-blue-600 stroke-[0.75]" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 leading-tight whitespace-pre-line">
                    {svc.title}
                  </span>
                  {svc.desc && (
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{svc.desc}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 mb-4">
                  <span className="text-lg font-bold text-blue-600">{item.step}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Home Upgrades, <span className="text-blue-600">Made Simple</span>
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                No hunting for contractors, no guessing on prices — just fast,
                free quotes from verified local professionals.
              </p>
              <div className="space-y-3">
                {[
                  "Licensed & insured contractors only",
                  "Free quotes with zero obligation",
                  "Matched in under 2 minutes",
                  "Coverage in all 50 states",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 sm:p-8 text-white">
              <div className="space-y-5">
                {[
                  { n: "1", t: "Tell Us Your Need", d: "Roofing, solar, windows & more" },
                  { n: "2", t: "We Find the Best", d: "Vetted, top-rated pros near you" },
                  { n: "3", t: "You Save Big", d: "Compare quotes, pick the best deal" },
                ].map((s, i) => (
                  <div key={i}>
                    {i > 0 && <div className="w-full h-px bg-white/10 mb-5" />}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold">{s.n}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-0.5">{s.t}</h4>
                        <p className="text-blue-200 text-xs">{s.d}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-400 pt-10 pb-6">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-gray-800">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo1} alt="Logo" className="w-20 h-20 object-contain" />
                <span className="text-white text-sm font-bold">
                  QuickHomeFix<span className="text-orange-500">.</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                Connecting homeowners with top-rated local professionals.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Services</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="/get-quotes/roof">Roofing</a></li>
                <li><a href="/get-quotes/solar">Solar</a></li>
                <li><a href="/get-quotes/windows">Windows</a></li>
                <li><a href="/get-quotes/bath">Bathroom</a></li>
                <li><a href="/get-quotes/gutter">Gutters</a></li>
                <li><a href="/get-quotes/shower">Walk-In Showers</a></li>
                <li><a href="/get-quotes/tub">Walk-In Tubs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Company</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#about" className="">How It Works</a></li>
                <li><a href="#services" className="">Services</a></li>
                <li><a href="#contact" className="">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span>info@quickhomefix.com</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                  <span>16192 Costal Highway, Lewes, DE 19958</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 text-[11px] text-gray-500">
            <span>&copy; {new Date().getFullYear()} QuickHomeFix. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="/privacy-policy">Privacy Policy</a>
              <a href="/terms-of-service">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
