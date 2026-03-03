import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Mail,
  ArrowRight,
} from "lucide-react";
import logo1 from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";

/* ─── Image Carousel ─── */
function ImageCarousel({ images, alt = "Project", height = "h-56 sm:h-72 lg:h-80" }) {
  const [current, setCurrent] = useState(0);
  const total = images?.length || 0;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, total]);

  if (!images || total === 0) return null;

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
      <div className={`relative w-full ${height}`}>
        {images.map((img, i) => (
          <img key={i} src={img} alt={`${alt} ${i + 1}`}
            loading="lazy" decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
      {total > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          <button onClick={next} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/50 w-2"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── FAQ Accordion ─── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left">
        <span className="text-base font-semibold text-gray-900 leading-snug">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-6 pb-4 animate-expand">
          <p className="text-[15px] text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Star Rating ─── */
function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

/* ─── ZIP CTA ─── */
function ZipCta({ zip, setZip, onSubmit, variant = "hero" }) {
  const isHero = variant === "hero";
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <div className={`flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-xl border ${isHero ? "bg-white/10 border-white/20" : "bg-gray-50 border-gray-200"}`}>
        <div className="relative flex-1">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" inputMode="numeric" maxLength={5} value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter Your ZIP Code"
            className="w-full bg-white rounded-lg pl-10 pr-4 py-3.5 text-base font-medium text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button onClick={onSubmit}
          className="bg-orange-500 text-white font-bold px-6 py-3.5 rounded-lg whitespace-nowrap text-base flex items-center justify-center gap-2">
          Get Started <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <p className={`mt-2.5 text-sm text-center ${isHero ? "text-blue-200/70" : "text-gray-400"}`}>
        Free, no-obligation estimates. Takes less than 2 minutes.
      </p>
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ children, bg = "bg-white" }) {
  return (
    <section className={`py-12 ${bg}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">{children}</div>
    </section>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">{children}</h2>;
}

/* ═══════════════════════════════════════════
   Main ServiceLandingPage
   ═══════════════════════════════════════════ */
export default function ServiceLandingPage({ data, onStartWizard }) {
  const [zip, setZip] = useState("");
  const handleSubmit = () => onStartWizard(zip);

  if (!data) return null;

  return (
    <div className="text-gray-700 overflow-x-hidden min-h-screen flex flex-col bg-white">

      {/* ─── Hero (header inside, same background) ─── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo1} alt="Logo" className="w-20 h-20 object-contain" />
            <span className="text-lg font-bold text-white">QuickHomeFix</span>
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                {data.heroTitle}
              </h1>
              <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0">
                {data.heroSubtitle}
              </p>
              <ZipCta zip={zip} setZip={setZip} onSubmit={handleSubmit} variant="hero" />
            </div>
            {/* Hero illustration – all devices, full size */}
            {data.heroImage ? (
              <div className="flex justify-center items-center">
                <img
                  src={data.heroImage}
                  alt={data.heroTitle}
                  loading="eager" decoding="async"
                  className="w-full h-auto object-contain drop-shadow-xl"
                />
              </div>
            ) : data.gallery && data.gallery.length > 0 ? (
              <div className="hidden lg:block">
                <ImageCarousel images={data.gallery} alt={data.overviewTitle} height="h-64 lg:h-72" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── Service Overview ─── */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {data.gallery && data.gallery.length > 0 && (
            <div className="lg:hidden">
              <ImageCarousel images={data.gallery} alt={data.overviewTitle} height="h-48 sm:h-64" />
            </div>
          )}
          {data.overviewImage && (
            <div className="hidden lg:block rounded-lg overflow-hidden border border-gray-200">
              <img src={data.overviewImage} alt={data.overviewTitle} loading="lazy" decoding="async" className="w-full h-72 object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{data.overviewTitle}</h2>
            <p className="text-[15px] text-gray-600 mb-5 leading-relaxed">{data.overviewSubtitle}</p>
            <div className="space-y-3">
              {data.overviewBenefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[15px] text-gray-800 leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSubmit}
              className="mt-6 bg-orange-500 text-white font-bold px-7 py-3 rounded-lg text-base flex items-center gap-2">
              Get Free Quote <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Section>

      {/* ─── Features ─── */}
      <Section bg="bg-gray-50">
        <SectionTitle>Features</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.features.map((feat, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                <span className="text-base font-bold text-blue-600">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5">{feat.title}</h3>
              <p className="text-[15px] text-gray-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Advantages ─── */}
      <Section>
        <SectionTitle>Advantages</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.advantages.map((adv, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg border border-gray-200">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 mb-1">{adv.title}</h3>
                <p className="text-[15px] text-gray-600 leading-relaxed">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Photo Gallery ─── */}
      {data.gallery && data.gallery.length > 0 && (
        <Section bg="bg-gray-50">
          <SectionTitle>Photo Gallery of Completed Projects</SectionTitle>
          <ImageCarousel images={data.gallery} alt="Completed project" height="h-52 sm:h-64 lg:h-80" />
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            {data.gallery.map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-200 group cursor-pointer">
                <img src={img} alt={`Project ${i + 1}`} loading="lazy" decoding="async" className="w-full h-20 sm:h-28 lg:h-36 object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Reviews ─── */}
      <Section>
        <SectionTitle>Reviews from Homeowners</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.reviews.map((review, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
              <StarRating rating={review.rating} />
              <p className="text-[15px] text-gray-700 leading-relaxed mt-3 mb-4">"{review.text}"</p>
              <div className="flex items-center gap-2.5">
                {review.avatar ? (
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{review.name[0]}</span>
                  </div>
                )}
                <div>
                  <span className="text-[15px] font-bold text-gray-900 block">{review.name}</span>
                  <span className="text-xs text-gray-400">Verified Homeowner</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── FAQ ─── */}
      <Section bg="bg-gray-50">
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        <div className="max-w-2xl mx-auto space-y-3">
          {data.faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-gray-400 pt-10 pb-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pb-8 border-b border-gray-800">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src={logo1} alt="Logo" className="w-20 h-20 object-contain" />
                <span className="text-white text-[15px] font-bold">QuickHomeFix</span>
              </div>
              <p className="text-sm leading-relaxed">Connecting homeowners with top-rated local professionals.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/get-quotes/roof" className="">Roofing</a></li>
                <li><a href="/get-quotes/solar" className="">Solar</a></li>
                <li><a href="/get-quotes/windows" className="">Windows</a></li>
                <li><a href="/get-quotes/gutter" className="">Gutters</a></li>
                <li><a href="/get-quotes/bath" className="">Bathroom</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/#about" className="">How It Works</a></li>
                <li><a href="/#services" className="">Services</a></li>
                <li><a href="/#contact" className="">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500 flex-shrink-0" /><span>info@quickhomefix.com</span></div>
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" /><span>16192 Costal Highway, Lewes, DE 19958</span></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 text-xs text-gray-500">
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
