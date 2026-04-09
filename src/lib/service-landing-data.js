/**
 * Landing page content for each service.
 * Used by ServiceLandingPage.jsx to render service-specific marketing pages.
 */

// ─── Image imports (real professional photos) ───
import bath1 from "@/assets/images/landing/bath-1.jpg";
import bath2 from "@/assets/images/landing/bath-2.jpg";
import bath3 from "@/assets/images/landing/bath-3.jpg";

import tub1 from "@/assets/images/landing/tub-1.jpg";
import tub2 from "@/assets/images/landing/tub-2.jpg";
import tub3 from "@/assets/images/landing/tub-3.jpg";

import roof1 from "@/assets/images/landing/roof-1.jpg";
import roof2 from "@/assets/images/landing/roof-2.jpg";
import roof3 from "@/assets/images/landing/roof-3.jpg";

import solar1 from "@/assets/images/landing/solar-1.jpg";
import solar2 from "@/assets/images/landing/solar-2.jpg";
import solar3 from "@/assets/images/landing/solar-3.jpg";

import window1 from "@/assets/images/landing/window-1.jpg";
import window2 from "@/assets/images/landing/window-2.jpg";
import window3 from "@/assets/images/landing/window-3.jpg";

import gutter1 from "@/assets/images/landing/gutter-1.jpg";
import gutter2 from "@/assets/images/landing/gutter-2.jpg";
import gutter3 from "@/assets/images/landing/gutter-3.jpg";

// ─── Hero illustration images (per service) ───
import roofHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png";
import windowHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png";
import bathHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png";
import tubHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png";

const serviceLandingData = {
  bath: {
    id: "bath",
    heroTitle: "Top Walk-In Shower Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top professionals near you.",
    heroImage: bathHeroImg,
    overviewImage: bath1,
    gallery: [bath1, bath2, bath3],
    overviewTitle: "Shower Remodeling & Tub-To-Shower Conversion",
    overviewSubtitle: "You will be surprised how affordable it can be:",
    overviewBenefits: [
      "Available in most States",
      "Competitive local pricing",
      "Lifetime of independent living",
      "Shower seated or standing",
      "Multiple grab bar options",
      "Superior style and comfort",
    ],
    features: [
      { title: "Low-Entry Access", desc: "Features a low-entry design for easy access, ideal for all mobility levels." },
      { title: "Easy-to-Grip Handrails", desc: "Provides stability and support with ergonomically designed handrails." },
      { title: "Built-In Seating Options", desc: "Enjoy comfort with both permanent and adjustable seating choices." },
    ],
    advantages: [
      { title: "Warm & Comfortable", desc: "Walk-in showers keep you warm since water flows only when you turn on the shower. No need to sit and wait for the tub to fill." },
      { title: "More Safety", desc: "Walk-in showers are easy to get in and out of. Perfect for small children, elderly, and those with mobility challenges." },
      { title: "Better Hygiene", desc: "It's easy to clean yourself comfortably on your shower bench. Quickly rinse off soap film and reduce mold." },
      { title: "Long-Term Durability", desc: "Walk-in showers use fewer parts than a regular bathtub, which means fewer things that can break over time." },
      { title: "Use Less Water", desc: "A shower uses 10 to 25 gallons of water, while a bath can use up to 70 gallons. Save on your water bills." },
      { title: "Easy Maintenance", desc: "Modern walk-in showers feature easy-clean surfaces and minimal grout lines, reducing cleaning effort significantly." },
    ],
    reviews: [
      { name: "Joe", rating: 5, text: "They installed 2 days after we signed contract and the installers were nice, quiet, fast, and cleaned up the house well.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "Kelly", rating: 5, text: "The team that came out was honest, and thorough and focused on safety.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
      { name: "Beth", rating: 5, text: "The products they use, the lifetime guaranty, seemed to outdo the competition from our experience.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
    ],
    faqs: [
      { question: "What is the cost of a walk-in shower?", answer: "Pricing can vary based on the size of the space and materials you choose. On average, homeowners spend about $16,800, though projects typically range from $8,400 to $33,600." },
      { question: "Is it possible to replace the shower stall yourself?", answer: "While DIY is possible for simple replacements, hiring a professional ensures proper waterproofing, plumbing connections, and code compliance for a lasting result." },
      { question: "What kind of installation services do contractors offer?", answer: "Contractors typically offer full-service installation including demolition, plumbing, waterproofing, tile work, fixture installation, and final cleanup." },
      { question: "How long does a walk-in shower installation take?", answer: "Most walk-in shower installations are completed within 1 to 3 days, depending on the complexity of the project and customization required." },
    ],
  },

  tub: {
    id: "tub",
    heroTitle: "Top Walk-In Tub Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top professionals near you.",
    heroImage: tubHeroImg,
    overviewImage: tub1,
    gallery: [tub1, tub2, tub3],
    overviewTitle: "Walk-In Tub Installation & Conversion",
    overviewSubtitle: "Safe, comfortable bathing solutions for your home:",
    overviewBenefits: [
      "Available in most States",
      "Competitive local pricing",
      "Therapeutic hydrotherapy jets",
      "Low step-in entry door",
      "Built-in safety features",
      "ADA compliant options",
    ],
    features: [
      { title: "Low Step-In Entry", desc: "A door with a low threshold makes getting in and out safe and simple for everyone." },
      { title: "Hydrotherapy Jets", desc: "Built-in water and air jets provide therapeutic relief for sore muscles and joints." },
      { title: "Anti-Slip Surfaces", desc: "Textured flooring and built-in grab bars ensure maximum safety during bathing." },
    ],
    advantages: [
      { title: "Enhanced Safety", desc: "Low entry threshold and built-in grab bars significantly reduce the risk of slips and falls in the bathroom." },
      { title: "Therapeutic Benefits", desc: "Hydrotherapy jets help relieve arthritis pain, improve circulation, and reduce muscle tension naturally." },
      { title: "Independence", desc: "Walk-in tubs allow seniors and those with mobility issues to bathe independently with confidence and dignity." },
      { title: "Increased Home Value", desc: "Installing a walk-in tub can increase your home's appeal to buyers looking for accessible bathroom features." },
      { title: "Quick Fill & Drain", desc: "Modern walk-in tubs feature fast-fill faucets and quick-drain technology so you don't wait long." },
      { title: "Customizable Options", desc: "Choose from heated seats, chromotherapy lighting, aromatherapy systems, and more for a spa-like experience." },
    ],
    reviews: [
      { name: "Margaret", rating: 5, text: "The walk-in tub changed my life. I can bathe safely now without worrying about falling. The jets are wonderful for my arthritis.", avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
      { name: "Robert", rating: 5, text: "Professional installation, done in one day. The team was courteous and cleaned up everything. Highly recommend.", avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
      { name: "Susan", rating: 5, text: "We compared several companies and this was the best value. The heated seat is my favorite feature!", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
    ],
    faqs: [
      { question: "How much does a walk-in tub cost?", answer: "Walk-in tub prices typically range from $2,000 to $10,000 depending on features. Installation costs add $1,500 to $5,000. Many financing options are available." },
      { question: "How long does installation take?", answer: "Most walk-in tub installations are completed in 1 to 2 days. Your contractor will handle plumbing, electrical connections, and any necessary bathroom modifications." },
      { question: "Will a walk-in tub fit in my existing bathroom?", answer: "Walk-in tubs come in various sizes. Many models are designed to fit in a standard bathtub alcove, making replacement straightforward without major renovation." },
      { question: "Are walk-in tubs covered by insurance?", answer: "Some insurance plans and Medicare Advantage plans may cover part of the cost if medically necessary. A doctor's recommendation can help with approval." },
    ],
  },

  roof: {
    id: "roof",
    heroTitle: "Top Roofing Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top roofing professionals near you.",
    heroImage: roofHeroImg,
    overviewImage: roof1,
    gallery: [roof1, roof2, roof3],
    overviewTitle: "Roof Repair, Replacement & New Installation",
    overviewSubtitle: "Protect your home with a quality roof:",
    overviewBenefits: [
      "Licensed & insured contractors",
      "Free inspection & estimates",
      "All roofing materials available",
      "Storm damage specialists",
      "Warranty-backed work",
      "Financing options available",
    ],
    features: [
      { title: "Complete Roof Replacement", desc: "Full tear-off and replacement with premium materials and manufacturer warranties." },
      { title: "Emergency Leak Repair", desc: "Fast response for urgent leaks and storm damage to protect your home immediately." },
      { title: "Roof Inspection & Maintenance", desc: "Thorough inspections to identify issues early and extend the life of your roof." },
    ],
    advantages: [
      { title: "Protect Your Investment", desc: "A quality roof protects your entire home from water damage, mold, and structural deterioration." },
      { title: "Energy Efficiency", desc: "Modern roofing materials reflect heat and provide better insulation, lowering your energy bills year-round." },
      { title: "Increased Home Value", desc: "A new roof can increase your home's resale value by an average of $12,000 to $15,000." },
      { title: "Weather Protection", desc: "Today's roofing systems are engineered to withstand high winds, hail, and extreme weather conditions." },
      { title: "Insurance Compliance", desc: "An up-to-date roof keeps your homeowner's insurance valid and may lower your premiums." },
      { title: "Curb Appeal", desc: "A new roof instantly transforms your home's appearance with modern colors and styles to choose from." },
    ],
    reviews: [
      { name: "Michael", rating: 5, text: "They replaced our entire roof in just two days. The crew was professional, and the cleanup was spotless.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
      { name: "Linda", rating: 5, text: "After the storm, they responded quickly, worked with our insurance, and the new roof looks amazing.", avatar: "https://randomuser.me/api/portraits/women/56.jpg" },
      { name: "David", rating: 5, text: "Best price we got from 4 quotes. Great communication throughout the project. Highly recommend.", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
    ],
    faqs: [
      { question: "How much does a new roof cost?", answer: "A new roof typically costs between $5,000 and $15,000, depending on the size of your home, roofing material, and your location. Asphalt shingles are the most affordable option." },
      { question: "How long does a roof replacement take?", answer: "Most residential roof replacements are completed in 1 to 3 days, depending on the size and complexity of the roof and weather conditions." },
      { question: "How do I know if I need a new roof?", answer: "Signs include missing or curling shingles, granules in gutters, daylight through roof boards, sagging areas, and a roof older than 20-25 years." },
      { question: "Will my insurance cover roof replacement?", answer: "Homeowner's insurance typically covers roof damage from storms, hail, and fallen trees. Regular wear and tear is usually not covered." },
    ],
  },

  solar: {
    id: "solar",
    heroTitle: "Top Solar Installation Experts Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top solar professionals near you.",
    overviewImage: solar1,
    gallery: [solar1, solar2, solar3],
    overviewTitle: "Solar Panel Installation & Energy Solutions",
    overviewSubtitle: "Start saving on your energy bills today:",
    overviewBenefits: [
      "Federal tax credits available",
      "Reduce electricity bills up to 70%",
      "Increase your home's value",
      "Clean, renewable energy",
      "25-year panel warranties",
      "Net metering benefits",
    ],
    features: [
      { title: "Custom System Design", desc: "Every solar system is designed specifically for your roof layout, sun exposure, and energy needs." },
      { title: "Premium Panel Technology", desc: "High-efficiency panels that maximize energy production even on cloudy days." },
      { title: "Battery Storage Options", desc: "Add battery storage to keep your power on during outages and maximize savings." },
    ],
    advantages: [
      { title: "Slash Energy Bills", desc: "Solar homeowners save an average of $1,500 per year on electricity. Your savings start from day one." },
      { title: "Federal Tax Credit", desc: "The federal solar tax credit lets you deduct 30% of the cost of installing a solar system from your taxes." },
      { title: "Boost Home Value", desc: "Homes with solar panels sell for an average of 4.1% more than comparable homes without solar." },
      { title: "Energy Independence", desc: "Generate your own clean power and reduce your reliance on the grid and rising utility rates." },
      { title: "Low Maintenance", desc: "Solar panels require minimal maintenance — just occasional cleaning — and last 25+ years with warranties." },
      { title: "Environmental Impact", desc: "A typical home solar system offsets about 100,000 lbs of carbon dioxide over 20 years." },
    ],
    reviews: [
      { name: "James", rating: 5, text: "Our electricity bill went from $280/month to $35. The installation team was incredible and finished in one day.", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
      { name: "Patricia", rating: 5, text: "The whole process was seamless. They handled everything including permits and utility paperwork.", avatar: "https://randomuser.me/api/portraits/women/17.jpg" },
      { name: "Richard", rating: 5, text: "Great financing options made it affordable. The system paid for itself in under 5 years.", avatar: "https://randomuser.me/api/portraits/men/41.jpg" },
    ],
    faqs: [
      { question: "How much do solar panels cost?", answer: "The average residential solar system costs between $15,000 and $25,000 before incentives. After the 30% federal tax credit, costs are significantly reduced." },
      { question: "How long does solar installation take?", answer: "The physical installation typically takes 1 to 3 days. The entire process including permits and inspections usually takes 2 to 3 months." },
      { question: "Do solar panels work on cloudy days?", answer: "Yes, solar panels still generate electricity on cloudy days, though at reduced efficiency. Modern panels are designed to capture diffused sunlight." },
      { question: "What happens to excess energy my panels produce?", answer: "With net metering, excess energy is sent back to the grid and you receive credits on your utility bill, effectively spinning your meter backward." },
    ],
  },

  windows: {
    id: "windows",
    heroTitle: "Top Window Replacement Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top window professionals near you.",
    heroImage: windowHeroImg,
    overviewImage: window1,
    gallery: [window1, window2, window3],
    overviewTitle: "Window Replacement & Installation",
    overviewSubtitle: "Upgrade your home with energy-efficient windows:",
    overviewBenefits: [
      "Energy-efficient options",
      "Noise reduction technology",
      "UV protection coatings",
      "Custom sizes & styles",
      "Professional installation",
    ],
    features: [
      { title: "Double & Triple Pane", desc: "Multi-pane windows with gas fills provide superior insulation and energy savings." },
      { title: "Custom Fit Installation", desc: "Precision measured and custom-built to fit your home's exact window openings." },
      { title: "Low-E Glass Coatings", desc: "Special coatings reduce UV rays and heat transfer while letting natural light through." },
    ],
    advantages: [
      { title: "Lower Energy Bills", desc: "Energy-efficient windows can reduce heating and cooling costs by 25-30% compared to single-pane windows." },
      { title: "Noise Reduction", desc: "Multi-pane windows significantly reduce outside noise, creating a quieter, more comfortable home." },
      { title: "Increased Home Value", desc: "Window replacement offers one of the highest returns on investment of any home improvement project." },
      { title: "UV Protection", desc: "Low-E glass coatings block up to 99% of harmful UV rays, protecting your furniture and flooring from fading." },
      { title: "Enhanced Security", desc: "Modern windows feature multi-point locking systems and impact-resistant glass options for added safety." },
      { title: "Curb Appeal", desc: "New windows instantly refresh your home's exterior appearance with modern styles and clean sight lines." },
    ],
    reviews: [
      { name: "Tom", rating: 5, text: "Replaced all 12 windows in our home. The difference in temperature consistency is incredible. Much quieter too.", avatar: "https://randomuser.me/api/portraits/men/75.jpg" },
      { name: "Sarah", rating: 5, text: "Professional crew, clean installation, and the windows look beautiful. Our energy bill dropped noticeably.", avatar: "https://randomuser.me/api/portraits/women/26.jpg" },
      { name: "Chris", rating: 5, text: "Great experience from quote to installation. They helped us choose the right style for our home.", avatar: "https://randomuser.me/api/portraits/men/36.jpg" },
    ],
    faqs: [
      { question: "How much does window replacement cost?", answer: "Window replacement costs $300 to $1,200 per window depending on the type, size, and material. A full-home replacement typically ranges from $3,000 to $20,000." },
      { question: "How long does window installation take?", answer: "Most window installations take 30-60 minutes per window. A full home with 10-15 windows can typically be completed in 1 to 2 days." },
      { question: "What type of windows are most energy efficient?", answer: "Double or triple-pane windows with Low-E coatings and argon gas fills offer the best energy efficiency. Look for ENERGY STAR certified products." },
      { question: "Should I replace all windows at once?", answer: "Replacing all windows at once is more cost-effective and ensures consistent appearance and performance, but you can replace them in phases if budget is a concern." },
    ],
  },

  gutter: {
    id: "gutter",
    heroTitle: "Top Gutter Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top gutter professionals near you.",
    overviewImage: gutter1,
    gallery: [gutter1, gutter2, gutter3],
    overviewTitle: "Gutter Installation, Repair & Guards",
    overviewSubtitle: "Protect your home from water damage:",
    overviewBenefits: [
      "Seamless gutter systems",
      "Gutter guard installation",
      "All materials available",
      "Storm damage repair",
      "Downspout solutions",
      "Free estimates",
    ],
    features: [
      { title: "Seamless Gutters", desc: "Custom-fabricated on-site for a perfect fit with no seams to leak or fail." },
      { title: "Gutter Guards", desc: "Keep leaves and debris out while letting water flow freely. Reduce maintenance dramatically." },
      { title: "Downspout Systems", desc: "Properly designed drainage that directs water safely away from your foundation." },
    ],
    advantages: [
      { title: "Foundation Protection", desc: "Gutters channel water away from your foundation, preventing costly cracks, settling, and basement flooding." },
      { title: "Prevent Water Damage", desc: "Without gutters, water runs down your siding causing staining, rot, and damage to your home's exterior." },
      { title: "Landscape Preservation", desc: "Controlled water drainage prevents soil erosion and protects your landscaping and garden beds." },
      { title: "Prevent Ice Dams", desc: "Properly installed gutters help prevent ice dams in winter that can damage your roof and interior." },
      { title: "Low Maintenance", desc: "Seamless gutters with guards require minimal cleaning and maintenance compared to traditional systems." },
      { title: "Long Lifespan", desc: "Quality aluminum and steel gutters last 20-30+ years, providing reliable protection for decades." },
    ],
    reviews: [
      { name: "Mark", rating: 5, text: "Seamless gutters installed in one day. No more leaky joints. The gutter guards are a game changer — no more climbing ladders.", avatar: "https://randomuser.me/api/portraits/men/55.jpg" },
      { name: "Nancy", rating: 5, text: "After years of basement water issues, new gutters solved the problem completely. Wish we'd done it sooner.", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
      { name: "Steve", rating: 5, text: "Fair pricing, professional installation, and the gutters look great. They even color-matched to our trim.", avatar: "https://randomuser.me/api/portraits/men/60.jpg" },
    ],
    faqs: [
      { question: "How much do new gutters cost?", answer: "Seamless gutter installation typically costs $6 to $15 per linear foot. The average home requires 150-200 feet of gutters, putting total costs between $900 and $3,000." },
      { question: "How long does gutter installation take?", answer: "Most gutter installations are completed in a single day. Larger homes or complex configurations may require two days." },
      { question: "Are gutter guards worth it?", answer: "Yes — gutter guards reduce cleaning frequency from 2-4 times per year to almost never, prevent clogs, and extend the life of your gutters." },
      { question: "What material is best for gutters?", answer: "Aluminum is the most popular choice — lightweight, rust-resistant, and affordable. Copper and steel are premium options with longer lifespans." },
    ],
  },
};

export function getServiceLandingData(serviceId) {
  return serviceLandingData[serviceId] || null;
}

export default serviceLandingData;
