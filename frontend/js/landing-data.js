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
    // ANGI EXHIBIT A COMPLIANCE: removed "Licensed & insured", "Free", "Warranty-backed", "Financing", "All roofing materials available" (Categories 1/2/8)
    overviewBenefits: ["Professional contractors","Thorough inspection & estimates","Storm damage specialists","Wide range of roofing materials","Emergency leak repair","Roof maintenance plans"],
    features: [
      // ANGI EXHIBIT A COMPLIANCE: removed "warranties" (Category 8)
      { title: "Complete Roof Replacement", desc: "Full tear-off and replacement with premium materials from trusted manufacturers." },
      { title: "Emergency Leak Repair", desc: "Fast response for urgent leaks and storm damage to protect your home immediately." },
      { title: "Roof Inspection & Maintenance", desc: "Thorough inspections to identify issues early and extend the life of your roof." }
    ],
    advantages: [
      { title: "Protect Your Home", desc: "A well-maintained roof helps shield your home's structure from water damage and mold." },
      { title: "Energy Efficiency", desc: "Modern roofing materials help reflect heat and improve insulation." },
      { title: "Home Value", desc: "A new roof is a common exterior update homeowners consider before selling." },
      { title: "Weather Protection", desc: "Today's roofing systems are built to hold up against wind, hail, and storms." },
      { title: "Insurance Compliance", desc: "An up-to-date roof can help keep your homeowner's insurance policy current." },
      { title: "Curb Appeal", desc: "A new roof can refresh your home's look with a range of colors and styles." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a new roof cost?", answer: "Most homeowners pay between $5,000 and $15,000 for a new roof, depending on the size of the home, the material chosen, and local labor rates." },
      { question: "How long does a roof replacement take?", answer: "A typical replacement takes 1 to 3 days once work begins, though larger or more complex roofs can take longer." },
      { question: "How do I know if I need a new roof?", answer: "Common signs include missing or curling shingles, granules collecting in gutters, daylight visible through the roof boards, sagging areas, and a roof over 20-25 years old." },
      { question: "Will my insurance cover roof replacement?", answer: "Homeowner's insurance often covers roof damage from storms, hail, or fallen trees, but typically not damage from normal wear and tear. Check your specific policy to be sure." }
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
      { title: "Home Value", desc: "A bathroom remodel is a common upgrade for homeowners looking to refresh their space." },
      { title: "Improved Functionality", desc: "A better layout can add storage, lighting, and fixtures where you need them." },
      { title: "Energy Efficiency", desc: "Low-flow fixtures, LED lighting, and efficient water heaters can help lower utility bills." },
      { title: "Updated Style", desc: "Swap outdated tile, vanities, and fixtures for a more modern look." },
      { title: "Better Storage", desc: "Custom cabinets, built-in shelving, and smarter storage options." },
      { title: "Enhanced Comfort", desc: "Options like heated floors and rain showerheads add everyday comfort." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "A full remodel typically runs $10,000 to $30,000, while smaller updates can start around $5,000, depending on materials and layout changes." },
      { question: "How long does a bathroom remodel take?", answer: "Most remodels take 2 to 4 weeks, though the timeline can stretch longer for bigger layout changes or custom work." },
      { question: "What does a full bathroom remodel include?", answer: "A full remodel usually covers new flooring, tile work, a vanity, fixtures, lighting, plumbing updates, and painting." },
      { question: "Do I need permits for a bathroom remodel?", answer: "Plumbing or electrical changes usually require a permit — your contractor can confirm what your local codes require." }
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
      // ANGI EXHIBIT A COMPLIANCE: removed unsourced ROI ranking claim (Category 2 unsubstantiated claim)
      { title: "Home Value", desc: "A bathroom remodel is a popular upgrade among homeowners looking to update their space." },
      { title: "Improved Safety", desc: "Walk-in tubs and showers reduce the risk of slips and falls." },
      { title: "Energy Efficiency", desc: "Modern low-flow fixtures and LED lighting reduce your utility bills." },
      { title: "Updated Style", desc: "Replace outdated tile, vanities, and fixtures with modern designs." },
      { title: "Better Storage", desc: "Custom cabinets, built-in shelving, and smart storage solutions." },
      { title: "Enhanced Comfort", desc: "Heated floors, rain showerheads, and spa-like features." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "A full remodel typically runs $10,000 to $30,000, while smaller updates can start around $5,000, depending on materials and layout changes." },
      { question: "How much does a walk-in tub cost?", answer: "Walk-in tubs generally run $2,000 to $10,000 depending on features, with installation adding another $1,500 to $5,000." },
      { question: "How long does installation take?", answer: "Most projects take 1 to 4 weeks depending on the scope of work involved." },
      { question: "Do I need permits?", answer: "Plumbing or electrical changes usually require a permit — your contractor can confirm what your local codes require." }
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
      { title: "Enhanced Safety", desc: "A low entry threshold and grab bars help reduce the risk of slips and falls." },
      { title: "Therapeutic Benefits", desc: "Hydrotherapy jets can offer relief for sore muscles and joints." },
      { title: "Independence", desc: "A walk-in tub can make bathing on your own more comfortable." },
      { title: "Home Value", desc: "A walk-in tub can add appeal for accessibility-focused buyers." },
      { title: "Quick Fill & Drain", desc: "Fast-fill faucets and quick-drain technology cut down on wait time." },
      { title: "Customizable Options", desc: "Choose from heated seats, chromotherapy, aromatherapy, and more." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a walk-in tub cost?", answer: "Walk-in tubs generally run $2,000 to $10,000 depending on features, with installation adding another $1,500 to $5,000." },
      { question: "How long does installation take?", answer: "Most installations are completed in 1 to 2 days." },
      { question: "Will it fit in my existing bathroom?", answer: "Many models are built to fit a standard bathtub alcove, but a contractor can confirm what will work for your space." },
      { question: "Are walk-in tubs covered by insurance?", answer: "Some insurance plans may cover part of the cost when medically necessary — check with your provider for specifics." }
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
      { title: "Enhanced Safety", desc: "Low-threshold entry and grab bars help reduce the risk of slips and falls." },
      { title: "Easy Accessibility", desc: "Barrier-free and ADA-compliant options make showering easier for everyone." },
      { title: "Low Maintenance", desc: "Seamless walls and quality finishes resist mold and wipe clean easily." },
      { title: "Home Value", desc: "A modern walk-in shower can add appeal for accessibility-focused and design-minded buyers." },
      { title: "Space Saving", desc: "Converting an old tub to a walk-in shower can open up a cramped bathroom." },
      { title: "Customizable Options", desc: "Choose from rain showerheads, built-in niches, bench seating, and more." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a walk-in shower cost?", answer: "Walk-in showers typically run $3,000 to $15,000 depending on size, materials, and whether it's a tub-to-shower conversion." },
      { question: "How long does installation take?", answer: "Most tub-to-shower conversions are completed in 1 to 3 days." },
      { question: "Can you convert my existing tub to a walk-in shower?", answer: "Yes — tub-to-shower conversions are a common and cost-effective bathroom upgrade." },
      { question: "Are walk-in showers a good accessibility option?", answer: "Yes. Low-threshold entry, grab bars, bench seating, and anti-slip floors can make a shower easier and safer to use." }
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
      { title: "Lower Energy Bills", desc: "Energy-efficient windows can help reduce heating and cooling costs." },
      { title: "Noise Reduction", desc: "Multi-pane windows help cut down on outside noise." },
      { title: "Home Value", desc: "New windows are a common upgrade for homeowners looking to modernize their home." },
      { title: "UV Protection", desc: "Low-E glass coatings help block harmful UV rays." },
      { title: "Enhanced Security", desc: "Modern windows feature multi-point locking systems." },
      { title: "Curb Appeal", desc: "New windows can refresh your home's exterior look." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does window replacement cost?", answer: "Windows typically cost $300 to $1,200 each installed, so a full-home replacement usually runs $3,000 to $20,000 depending on the number and style of windows." },
      { question: "How long does installation take?", answer: "Most windows take 30-60 minutes each to install, so a full-home job can often be completed in 1 to 2 days." },
      { question: "What type is most energy efficient?", answer: "Double or triple-pane windows with Low-E coatings and argon gas fills are commonly recommended for energy efficiency. Look for the ENERGY STAR label when comparing options." },
      { question: "Should I replace all windows at once?", answer: "Replacing all windows in one project is often more cost-effective, but doing it in phases can help spread out the budget." }
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
    // ANGI EXHIBIT A COMPLIANCE: removed "Federal", "warranties", unsourced savings figure, and tax-credit claim (Categories 2/4/8)
    overviewBenefits: ["Reduce your electricity bills","Clean, renewable energy","Custom system design","Battery storage options","Net metering benefits"],
    features: [
      { title: "Custom System Design", desc: "Every solar system is designed specifically for your roof layout and energy needs." },
      { title: "Premium Panel Technology", desc: "High-efficiency panels that maximize energy production even on cloudy days." },
      { title: "Battery Storage Options", desc: "Add battery storage to keep your power on during outages." }
    ],
    advantages: [
      { title: "Reduce Energy Bills", desc: "Solar can help offset a portion of your monthly electricity costs." },
      { title: "Energy Independence", desc: "Generate your own power and rely less on the grid." },
      { title: "Low Maintenance", desc: "Solar panels require minimal upkeep and are built to last for decades." },
      { title: "Environmental Impact", desc: "Solar panels generate electricity without ongoing emissions." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews with unsourced figures and financing language (Categories 2/8/9E)
    faqs: [
      { question: "How much do solar panels cost?", answer: "A typical residential system costs $15,000 to $25,000 before any tax credits. A tax professional can walk you through which credits you may qualify for." },
      { question: "How long does installation take?", answer: "Physical installation usually takes 1-3 days, but the full process including permits can take 2-3 months." },
      { question: "Do they work on cloudy days?", answer: "Yes, solar panels still generate electricity on cloudy days, just at reduced efficiency compared to full sun." },
      { question: "What about excess energy?", answer: "With net metering, excess energy you generate goes back to the grid and you receive bill credits in return." }
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
    // ANGI EXHIBIT A COMPLIANCE: removed "Free", "All materials available" (Category 1)
    overviewBenefits: ["Seamless gutter systems","Gutter guard installation","Storm damage repair","Downspout solutions","Gutter guard options"],
    features: [
      { title: "Seamless Gutters", desc: "Custom-fabricated on-site for a perfect fit with no seams to leak." },
      { title: "Gutter Guards", desc: "Keep leaves and debris out while letting water flow freely." },
      { title: "Downspout Systems", desc: "Properly designed drainage that directs water away from your foundation." }
    ],
    advantages: [
      { title: "Foundation Protection", desc: "Gutters help channel water away from your foundation, reducing the risk of cracks and flooding." },
      { title: "Prevent Water Damage", desc: "Without gutters, water can cause staining, rot, and exterior damage over time." },
      { title: "Landscape Preservation", desc: "Controlled drainage helps prevent soil erosion around your landscaping." },
      { title: "Prevent Ice Dams", desc: "Properly installed gutters can help reduce ice dams in winter." },
      { title: "Low Maintenance", desc: "Seamless gutters with guards need minimal cleaning." },
      { title: "Long Lifespan", desc: "Quality gutters are built to last for decades with proper care." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much do new gutters cost?", answer: "Seamless gutters typically run $6 to $15 per linear foot, putting most homes in the $900 to $3,000 range overall." },
      { question: "How long does installation take?", answer: "Most gutter installations are completed in a single day." },
      { question: "Are gutter guards worth it?", answer: "Gutter guards can reduce how often you need to clean your gutters and help prevent clogs." },
      { question: "What material is best?", answer: "Aluminum is a popular choice for being lightweight, rust-resistant, and affordable, though the best option depends on your home and budget." }
    ]
  }
};
