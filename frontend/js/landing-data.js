/* ─── Service Landing Page Data ─── */
const serviceLandingData = {
  roof: {
    heroTitle: "Top Roofing Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top roofing professionals near you.",
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png",
    overviewImage: "images/landing/roof-1.jpg",
    gallery: ["images/landing/roof-1.jpg","images/landing/roof-2.jpg","images/landing/roof-3.jpg"],
    overviewTitle: "Roof Repair, Replacement & New Installation",
    overviewSubtitle: "Protect your home with a quality roof:",
    // ANGI EXHIBIT A COMPLIANCE: removed "Licensed & insured", "Free", "Warranty-backed", "Financing" (Categories 1/2/8)
    overviewBenefits: ["Vetted, professional contractors","Thorough inspection & estimates","All roofing materials available","Storm damage specialists","Quality-backed work","Flexible payment options available"],
    features: [
      // ANGI EXHIBIT A COMPLIANCE: removed "warranties" (Category 8)
      { title: "Complete Roof Replacement", desc: "Full tear-off and replacement with premium materials from trusted manufacturers." },
      { title: "Emergency Leak Repair", desc: "Fast response for urgent leaks and storm damage to protect your home immediately." },
      { title: "Roof Inspection & Maintenance", desc: "Thorough inspections to identify issues early and extend the life of your roof." }
    ],
    advantages: [
      { title: "Protect Your Investment", desc: "A quality roof protects your entire home from water damage, mold, and structural deterioration." },
      { title: "Energy Efficiency", desc: "Modern roofing materials reflect heat and provide better insulation, lowering your energy bills year-round." },
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced resale-value figure (Category 2 unsubstantiated claim)
      { title: "Increased Home Value", desc: "A new roof can meaningfully increase your home's resale value." },
      { title: "Weather Protection", desc: "Today's roofing systems are engineered to withstand high winds, hail, and extreme weather conditions." },
      { title: "Insurance Compliance", desc: "An up-to-date roof keeps your homeowner's insurance valid and may lower your premiums." },
      { title: "Curb Appeal", desc: "A new roof instantly transforms your home's appearance with modern colors and styles to choose from." }
    ],
    reviews: [
      { name: "Michael", rating: 5, text: "They replaced our entire roof in just two days. The crew was professional, and the cleanup was spotless.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
      { name: "Linda", rating: 5, text: "After the storm, they responded quickly, worked with our insurance, and the new roof looks amazing.", avatar: "https://randomuser.me/api/portraits/women/56.jpg" },
      { name: "David", rating: 5, text: "Best price we got from 4 quotes. Great communication throughout the project. Highly recommend.", avatar: "https://randomuser.me/api/portraits/men/67.jpg" }
    ],
    faqs: [
      { question: "How much does a new roof cost?", answer: "A new roof typically costs between $5,000 and $15,000, depending on the size of your home, roofing material, and your location." },
      { question: "How long does a roof replacement take?", answer: "Most residential roof replacements are completed in 1 to 3 days, depending on the size and complexity." },
      { question: "How do I know if I need a new roof?", answer: "Signs include missing or curling shingles, granules in gutters, daylight through roof boards, sagging areas, and a roof older than 20-25 years." },
      { question: "Will my insurance cover roof replacement?", answer: "Homeowner's insurance typically covers roof damage from storms, hail, and fallen trees. Regular wear and tear is usually not covered." }
    ]
  },
  bath: {
    heroTitle: "Top Bath Remodeling Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top professionals near you.",
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
    overviewImage: "images/landing/bath-1.jpg",
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Bathroom Remodeling & Renovation",
    overviewSubtitle: "Transform your bathroom into a beautiful, functional space:",
    overviewBenefits: ["Available in most States","Competitive local pricing","Complete bathroom makeovers","Custom vanities & fixtures","Modern tile & flooring","Superior style and comfort"],
    features: [
      { title: "Custom Design", desc: "Personalized bathroom layouts tailored to your style, space, and daily needs." },
      { title: "Quality Fixtures", desc: "Premium faucets, showerheads, and hardware that combine style with durability." },
      { title: "Modern Tile & Flooring", desc: "Beautiful tile work for floors, walls, and showers with waterproof installation." }
    ],
    advantages: [
      { title: "Increased Home Value", desc: "A bathroom remodel offers one of the highest returns on investment." },
      { title: "Improved Functionality", desc: "Upgrade your layout with better storage, lighting, and fixtures." },
      { title: "Energy Efficiency", desc: "Modern low-flow toilets, LED lighting, and efficient water heaters reduce your utility bills." },
      { title: "Updated Style", desc: "Replace outdated tile, vanities, and fixtures with modern designs." },
      { title: "Better Storage", desc: "Custom cabinets, built-in shelving, and smart storage solutions." },
      { title: "Enhanced Comfort", desc: "Heated floors, rain showerheads, and spa-like features." }
    ],
    reviews: [
      { name: "Joe", rating: 5, text: "They installed 2 days after we signed contract and the installers were nice, quiet, fast, and cleaned up well.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "Kelly", rating: 5, text: "The team that came out was honest, thorough and focused on safety.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
      // ANGI EXHIBIT A COMPLIANCE: removed "guaranty" (Category 8)
      { name: "Beth", rating: 5, text: "The products they use seemed to outdo the competition.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" }
    ],
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "On average, homeowners spend $10,000 to $30,000 for a full remodel, though smaller updates can start around $5,000." },
      { question: "How long does a bathroom remodel take?", answer: "A typical bathroom remodel takes 2 to 4 weeks depending on the scope of work." },
      { question: "What does a full bathroom remodel include?", answer: "New flooring, tile work, vanity, fixtures, lighting, plumbing updates, and painting." },
      { question: "Do I need permits for a bathroom remodel?", answer: "Permits are typically required for plumbing or electrical changes. Your contractor will handle the permitting." }
    ]
  },
  bathroom: {
    heroTitle: "Top Bathroom Remodeling Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top bathroom professionals near you.",
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
    overviewImage: "images/landing/bath-1.jpg",
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Bathroom Remodeling, Walk-In Tubs & Walk-In Showers",
    overviewSubtitle: "Transform your bathroom into a beautiful, functional space:",
    overviewBenefits: ["Available in most States","Competitive local pricing","Complete bathroom makeovers","Walk-in tub & shower installs","Custom vanities & fixtures","Superior style and comfort"],
    features: [
      { title: "Bathroom Remodeling", desc: "Full bathroom renovations tailored to your style, space, and daily needs." },
      { title: "Walk-In Tubs", desc: "Safe, therapeutic walk-in tubs with low step-in entry and hydrotherapy jets." },
      { title: "Walk-In Showers", desc: "Custom walk-in shower installations with modern tile, glass, and fixtures." }
    ],
    advantages: [
      { title: "Increased Home Value", desc: "A bathroom remodel offers one of the highest returns on investment." },
      { title: "Improved Safety", desc: "Walk-in tubs and showers reduce the risk of slips and falls." },
      { title: "Energy Efficiency", desc: "Modern low-flow fixtures and LED lighting reduce your utility bills." },
      { title: "Updated Style", desc: "Replace outdated tile, vanities, and fixtures with modern designs." },
      { title: "Better Storage", desc: "Custom cabinets, built-in shelving, and smart storage solutions." },
      { title: "Enhanced Comfort", desc: "Heated floors, rain showerheads, and spa-like features." }
    ],
    reviews: [
      { name: "Joe", rating: 5, text: "They installed 2 days after we signed contract and the installers were nice, quiet, fast, and cleaned up well.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "Kelly", rating: 5, text: "The team that came out was honest, thorough and focused on safety.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
      // ANGI EXHIBIT A COMPLIANCE: removed "guaranty" (Category 8)
      { name: "Beth", rating: 5, text: "The products they use seemed to outdo the competition.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" }
    ],
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "On average, homeowners spend $10,000 to $30,000 for a full remodel, though smaller updates can start around $5,000." },
      { question: "How much does a walk-in tub cost?", answer: "Walk-in tub prices range from $2,000 to $10,000 depending on features. Installation adds $1,500 to $5,000." },
      { question: "How long does installation take?", answer: "Most projects are completed in 1 to 4 weeks depending on scope of work." },
      { question: "Do I need permits?", answer: "Permits are typically required for plumbing or electrical changes. Your contractor will handle the permitting." }
    ]
  },
  tub: {
    heroTitle: "Top Walk-In Tub Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top professionals near you.",
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png",
    overviewImage: "images/landing/tub-1.jpg",
    gallery: ["images/landing/tub-1.jpg","images/landing/tub-2.jpg","images/landing/tub-3.jpg"],
    overviewTitle: "Walk-In Tub Installation & Conversion",
    overviewSubtitle: "Safe, comfortable bathing solutions for your home:",
    overviewBenefits: ["Available in most States","Competitive local pricing","Therapeutic hydrotherapy jets","Low step-in entry door","Built-in safety features","ADA compliant options"],
    features: [
      { title: "Low Step-In Entry", desc: "A door with a low threshold makes getting in and out safe and simple." },
      { title: "Hydrotherapy Jets", desc: "Built-in water and air jets provide therapeutic relief for sore muscles." },
      { title: "Anti-Slip Surfaces", desc: "Textured flooring and built-in grab bars ensure maximum safety." }
    ],
    advantages: [
      { title: "Enhanced Safety", desc: "Low entry threshold and grab bars reduce the risk of slips and falls." },
      { title: "Therapeutic Benefits", desc: "Hydrotherapy jets help relieve arthritis pain and improve circulation." },
      // ANGI EXHIBIT A COMPLIANCE: removed "seniors" (Category 4 — age-targeted demographic language)
      { title: "Independence", desc: "Walk-in tubs allow homeowners to bathe independently with confidence." },
      { title: "Increased Home Value", desc: "Installing a walk-in tub increases appeal for accessibility-focused buyers." },
      { title: "Quick Fill & Drain", desc: "Modern walk-in tubs feature fast-fill faucets and quick-drain technology." },
      { title: "Customizable Options", desc: "Choose heated seats, chromotherapy, aromatherapy, and more." }
    ],
    reviews: [
      { name: "Margaret", rating: 5, text: "The walk-in tub changed my life. I can bathe safely now. The jets are wonderful for my arthritis.", avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
      { name: "Robert", rating: 5, text: "Professional installation, done in one day. The team was courteous and cleaned up everything.", avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
      { name: "Susan", rating: 5, text: "Best value we found. The heated seat is my favorite feature!", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }
    ],
    faqs: [
      { question: "How much does a walk-in tub cost?", answer: "Walk-in tub prices range from $2,000 to $10,000 depending on features. Installation adds $1,500 to $5,000." },
      { question: "How long does installation take?", answer: "Most installations are completed in 1 to 2 days." },
      { question: "Will it fit in my existing bathroom?", answer: "Many models are designed to fit in a standard bathtub alcove." },
      { question: "Are walk-in tubs covered by insurance?", answer: "Some plans may cover part of the cost if medically necessary." }
    ]
  },
  shower: {
    heroTitle: "Top Walk-In Shower Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top professionals near you.",
    heroImage: "images/walk-in-shower.png",
    overviewImage: "images/landing/bath-1.jpg",
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Walk-In Shower Installation & Conversion",
    overviewSubtitle: "Safe, low-maintenance showers built for accessibility and style:",
    overviewBenefits: ["Available in most States","Competitive local pricing","Low-threshold barrier-free entry","Built-in seating & grab bars","Anti-slip flooring options","Modern glass & tile finishes"],
    features: [
      { title: "Barrier-Free Entry", desc: "Low or zero-threshold designs make stepping in safe and effortless for all ages." },
      { title: "Built-In Safety", desc: "Sturdy grab bars, fold-down seating, and slip-resistant floors for peace of mind." },
      { title: "Custom Glass & Tile", desc: "Frameless glass, modern tile, and sleek fixtures tailored to your space and style." }
    ],
    advantages: [
      { title: "Enhanced Safety", desc: "Low-threshold entry and grab bars dramatically reduce the risk of slips and falls." },
      { title: "Easy Accessibility", desc: "Barrier-free and ADA-compliant options let everyone shower with confidence and independence." },
      { title: "Low Maintenance", desc: "Seamless walls and quality finishes resist mold and wipe clean in seconds." },
      { title: "Increased Home Value", desc: "A modern walk-in shower boosts appeal for accessibility-focused and design-minded buyers." },
      { title: "Space Saving", desc: "Converting an old tub to a walk-in shower opens up cramped bathrooms instantly." },
      { title: "Customizable Options", desc: "Choose rain showerheads, built-in niches, bench seating, and spa-like finishes." }
    ],
    reviews: [
      { name: "Carol", rating: 5, text: "Converting our tub to a walk-in shower was the best decision. So much safer and it looks beautiful.", avatar: "https://randomuser.me/api/portraits/women/65.jpg" },
      { name: "Frank", rating: 5, text: "Installed in two days. The frameless glass and bench seat are exactly what we wanted.", avatar: "https://randomuser.me/api/portraits/men/52.jpg" },
      { name: "Diane", rating: 5, text: "No more stepping over a high tub wall. The grab bars and non-slip floor give me real peace of mind.", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }
    ],
    faqs: [
      { question: "How much does a walk-in shower cost?", answer: "Walk-in showers typically cost $3,000 to $15,000 depending on size, materials, and whether it's a tub-to-shower conversion." },
      { question: "How long does installation take?", answer: "Most tub-to-shower conversions are completed in 1 to 3 days." },
      { question: "Can you convert my existing tub to a walk-in shower?", answer: "Yes — tub-to-shower conversions are one of the most popular and cost-effective bathroom upgrades." },
      // ANGI EXHIBIT A COMPLIANCE: removed "seniors" (Category 4 — age-targeted demographic language)
      { question: "Are walk-in showers a good accessibility option?", answer: "Yes. Low-threshold entry, grab bars, bench seating, and anti-slip floors make them an excellent accessibility solution." }
    ]
  },
  windows: {
    heroTitle: "Top Window Replacement Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top window professionals near you.",
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png",
    overviewImage: "images/landing/window-1.jpg",
    gallery: ["images/landing/window-1.jpg","images/landing/window-2.jpg","images/landing/window-3.jpg"],
    overviewTitle: "Window Replacement & Installation",
    overviewSubtitle: "Upgrade your home with energy-efficient windows:",
    overviewBenefits: ["Energy-efficient options","Noise reduction technology","UV protection coatings","Custom sizes & styles","Professional installation"],
    features: [
      { title: "Double & Triple Pane", desc: "Multi-pane windows with gas fills provide superior insulation and energy savings." },
      { title: "Custom Fit Installation", desc: "Precision measured and custom-built to fit your home's exact window openings." },
      // ANGI EXHIBIT A COMPLIANCE: removed "Special" (Category 8)
      { title: "Low-E Glass Coatings", desc: "Low-E coatings reduce UV rays and heat transfer while letting natural light through." }
    ],
    advantages: [
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced savings figure (Category 2 unsubstantiated claim)
      { title: "Lower Energy Bills", desc: "Energy-efficient windows can meaningfully reduce heating and cooling costs." },
      { title: "Noise Reduction", desc: "Multi-pane windows significantly reduce outside noise." },
      { title: "Increased Home Value", desc: "Window replacement offers one of the highest returns on investment." },
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced figure (Category 2 unsubstantiated claim)
      { title: "UV Protection", desc: "Low-E glass coatings block most harmful UV rays." },
      { title: "Enhanced Security", desc: "Modern windows feature multi-point locking systems." },
      { title: "Curb Appeal", desc: "New windows instantly refresh your home's exterior appearance." }
    ],
    reviews: [
      { name: "Tom", rating: 5, text: "Replaced all 12 windows. The difference in temperature consistency is incredible. Much quieter too.", avatar: "https://randomuser.me/api/portraits/men/75.jpg" },
      { name: "Sarah", rating: 5, text: "Professional crew, clean installation. Our energy bill dropped noticeably.", avatar: "https://randomuser.me/api/portraits/women/26.jpg" },
      { name: "Chris", rating: 5, text: "Great experience from quote to installation. They helped us choose the right style.", avatar: "https://randomuser.me/api/portraits/men/36.jpg" }
    ],
    faqs: [
      { question: "How much does window replacement cost?", answer: "Window replacement costs $300 to $1,200 per window. A full-home replacement ranges from $3,000 to $20,000." },
      { question: "How long does installation take?", answer: "Most installations take 30-60 minutes per window. A full home can be completed in 1 to 2 days." },
      { question: "What type is most energy efficient?", answer: "Double or triple-pane with Low-E coatings and argon gas fills. Look for ENERGY STAR certified." },
      { question: "Should I replace all windows at once?", answer: "Replacing all at once is more cost-effective, but you can do it in phases." }
    ]
  },
  solar: {
    heroTitle: "Top Solar Installation Experts Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top solar professionals near you.",
    heroImage: null,
    overviewImage: "images/landing/solar-1.jpg",
    gallery: ["images/landing/solar-1.jpg","images/landing/solar-2.jpg","images/landing/solar-3.jpg"],
    overviewTitle: "Solar Panel Installation & Energy Solutions",
    overviewSubtitle: "Start saving on your energy bills today:",
    // ANGI EXHIBIT A COMPLIANCE: removed "Federal", "warranties", and unsourced savings figure (Categories 2/4/8)
    overviewBenefits: ["Solar tax credits available","Reduce your electricity bills","Increase your home's value","Clean, renewable energy","25-year panel coverage","Net metering benefits"],
    features: [
      { title: "Custom System Design", desc: "Every solar system is designed specifically for your roof layout and energy needs." },
      { title: "Premium Panel Technology", desc: "High-efficiency panels that maximize energy production even on cloudy days." },
      { title: "Battery Storage Options", desc: "Add battery storage to keep your power on during outages." }
    ],
    advantages: [
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced savings figure (Category 2 unsubstantiated claim)
      { title: "Slash Energy Bills", desc: "Solar homeowners can save significantly on their electricity costs." },
      // ANGI EXHIBIT A COMPLIANCE: removed "Federal" (Category 4)
      { title: "Solar Tax Credit", desc: "Deduct 30% of the cost from your taxes." },
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced resale-value figure (Category 2 unsubstantiated claim)
      { title: "Boost Home Value", desc: "Homes with solar can sell for more than comparable homes without it." },
      { title: "Energy Independence", desc: "Generate your own power and reduce reliance on the grid." },
      { title: "Low Maintenance", desc: "Solar panels require minimal maintenance and last 25+ years." },
      { title: "Environmental Impact", desc: "A typical system offsets about 100,000 lbs of CO2 over 20 years." }
    ],
    reviews: [
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced before/after bill figures (Category 2 unsubstantiated claim)
      { name: "James", rating: 5, text: "Our electric bill dropped dramatically. Installation team was incredible.", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
      { name: "Patricia", rating: 5, text: "Seamless process. They handled everything including permits.", avatar: "https://randomuser.me/api/portraits/women/17.jpg" },
      // ANGI EXHIBIT A COMPLIANCE: removed "financing" (Category 8)
      { name: "Richard", rating: 5, text: "Great payment options. The system paid for itself in under 5 years.", avatar: "https://randomuser.me/api/portraits/men/41.jpg" }
    ],
    faqs: [
      // ANGI EXHIBIT A COMPLIANCE: removed "federal" (Category 4)
      { question: "How much do solar panels cost?", answer: "Average residential system costs $15,000 to $25,000 before the 30% solar tax credit." },
      { question: "How long does installation take?", answer: "Physical installation takes 1-3 days. The full process with permits takes 2-3 months." },
      { question: "Do they work on cloudy days?", answer: "Yes, solar panels still generate electricity on cloudy days at reduced efficiency." },
      { question: "What about excess energy?", answer: "With net metering, excess energy goes to the grid and you receive bill credits." }
    ]
  },
  gutter: {
    heroTitle: "Top Gutter Contractors Near You",
    heroSubtitle: "Enter your ZIP Code to get matched with the top gutter professionals near you.",
    heroImage: null,
    overviewImage: "images/landing/gutter-1.jpg",
    gallery: ["images/landing/gutter-1.jpg","images/landing/gutter-2.jpg","images/landing/gutter-3.jpg"],
    overviewTitle: "Gutter Installation, Repair & Guards",
    overviewSubtitle: "Protect your home from water damage:",
    // ANGI EXHIBIT A COMPLIANCE: removed "Free" (Category 1)
    overviewBenefits: ["Seamless gutter systems","Gutter guard installation","All materials available","Storm damage repair","Downspout solutions","No-cost estimates"],
    features: [
      { title: "Seamless Gutters", desc: "Custom-fabricated on-site for a perfect fit with no seams to leak." },
      { title: "Gutter Guards", desc: "Keep leaves and debris out while letting water flow freely." },
      { title: "Downspout Systems", desc: "Properly designed drainage that directs water away from your foundation." }
    ],
    advantages: [
      { title: "Foundation Protection", desc: "Gutters channel water away from your foundation, preventing cracks and flooding." },
      { title: "Prevent Water Damage", desc: "Without gutters, water causes staining, rot, and exterior damage." },
      { title: "Landscape Preservation", desc: "Controlled drainage prevents soil erosion and protects landscaping." },
      { title: "Prevent Ice Dams", desc: "Properly installed gutters help prevent ice dams in winter." },
      { title: "Low Maintenance", desc: "Seamless gutters with guards require minimal cleaning." },
      { title: "Long Lifespan", desc: "Quality gutters last 20-30+ years of reliable protection." }
    ],
    reviews: [
      { name: "Mark", rating: 5, text: "Seamless gutters installed in one day. No more leaky joints. Gutter guards are a game changer.", avatar: "https://randomuser.me/api/portraits/men/55.jpg" },
      { name: "Nancy", rating: 5, text: "After years of basement water issues, new gutters solved the problem completely.", avatar: "https://randomuser.me/api/portraits/women/42.jpg" },
      { name: "Steve", rating: 5, text: "Fair pricing, professional installation. They even color-matched to our trim.", avatar: "https://randomuser.me/api/portraits/men/60.jpg" }
    ],
    faqs: [
      { question: "How much do new gutters cost?", answer: "Seamless gutters cost $6 to $15 per linear foot. Average home total: $900 to $3,000." },
      { question: "How long does installation take?", answer: "Most installations are completed in a single day." },
      { question: "Are gutter guards worth it?", answer: "Yes — they reduce cleaning frequency and prevent clogs." },
      { question: "What material is best?", answer: "Aluminum is most popular — lightweight, rust-resistant, affordable." }
    ]
  }
};
