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
      { title: "Full Tear-Off & Replacement", desc: "Old roofing material is removed down to the deck before new material goes on." },
      { title: "Emergency Leak Repair", desc: "Fast response for urgent leaks and storm damage." },
      { title: "Roof Inspections", desc: "A close look at your roof's condition to identify problem areas." },
      { title: "Material Options", desc: "A range of roofing materials and styles to choose from." },
      { title: "Cleanup & Haul-Away", desc: "Removal of old roofing debris once the job is done." }
    ],
    advantages: [
      { title: "Protect Your Home", desc: "A well-maintained roof helps shield your home's structure from water damage and mold." },
      { title: "Energy Efficiency", desc: "Modern roofing materials help reflect heat and improve insulation." },
      { title: "Weather Protection", desc: "Today's roofing systems are built to hold up against wind, hail, and storms." },
      { title: "Curb Appeal", desc: "A new roof can refresh your home's look with a range of colors and styles." },
      { title: "Noise Reduction", desc: "A solid roofing system can help dampen sound from rain and hail." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a new roof cost?", answer: "Cost depends on the size of the home, the material chosen, and local labor rates. A local contractor can give you an exact price after seeing your roof." },
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
      { title: "Custom Layouts", desc: "Bathroom layouts designed around your space and daily routine." },
      { title: "Fixture Selection", desc: "Faucets, showerheads, and hardware in a range of styles." },
      { title: "Tile & Flooring", desc: "Tile work for floors, walls, and showers with waterproof installation." },
      { title: "Vanity Installation", desc: "New vanities and cabinetry sized to fit your bathroom." },
      { title: "Lighting Updates", desc: "Updated lighting fixtures to brighten the space." }
    ],
    advantages: [
      { title: "Improved Functionality", desc: "A better layout can add storage, lighting, and fixtures where you need them." },
      { title: "Energy Efficiency", desc: "Low-flow fixtures and LED lighting can help lower utility bills." },
      { title: "Updated Style", desc: "Swap outdated tile, vanities, and fixtures for a more modern look." },
      { title: "Better Storage", desc: "Custom cabinets and shelving for a more organized space." },
      { title: "Everyday Comfort", desc: "Options like heated floors and rain showerheads add comfort to daily routines." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "Cost depends on the scope of work, from smaller updates to a full renovation. A contractor can give you an exact price after seeing your space." },
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
      { title: "Full Renovations", desc: "Bathroom renovations tailored to your style, space, and daily needs." },
      { title: "Walk-In Tubs", desc: "Walk-in tubs with a low step-in entry and hydrotherapy jets." },
      { title: "Walk-In Showers", desc: "Walk-in shower installations with modern tile, glass, and fixtures." },
      { title: "Vanity & Fixture Updates", desc: "New vanities, faucets, and hardware to match your style." },
      { title: "Flooring Installation", desc: "Waterproof flooring options built for bathroom use." }
    ],
    advantages: [
      { title: "Improved Safety", desc: "Walk-in tubs and showers can help reduce the risk of slips and falls." },
      { title: "Energy Efficiency", desc: "Low-flow fixtures and LED lighting can help lower utility bills." },
      { title: "Updated Style", desc: "Replace outdated tile, vanities, and fixtures with a modern design." },
      { title: "Better Storage", desc: "Custom cabinets and shelving for a more organized space." },
      { title: "Everyday Comfort", desc: "Heated floors and rain showerheads add comfort to daily routines." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a bathroom remodel cost?", answer: "Cost depends on the scope of work, from smaller updates to a full renovation. A contractor can give you an exact price after seeing your space." },
      { question: "How much does a walk-in tub cost?", answer: "Cost depends on the features and installation involved. A contractor can give you an exact price for your setup." },
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
      { title: "Low Step-In Entry", desc: "A door with a low threshold for getting in and out." },
      { title: "Hydrotherapy Jets", desc: "Built-in water and air jets." },
      { title: "Anti-Slip Surfaces", desc: "Textured flooring and built-in grab bars." },
      { title: "Fast-Fill & Drain", desc: "Faucets and drain systems built to save time." },
      { title: "Customizable Add-Ons", desc: "Options like heated seats and aromatherapy." }
    ],
    advantages: [
      { title: "Enhanced Safety", desc: "A low entry threshold and grab bars can help reduce the risk of slips and falls." },
      { title: "Comfort Features", desc: "Hydrotherapy jets and heated seating add comfort to bath time." },
      { title: "Independence", desc: "A walk-in tub can make bathing on your own more comfortable." },
      { title: "Space-Conscious Design", desc: "Many models are built to fit within an existing tub footprint." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a walk-in tub cost?", answer: "Cost depends on the features and installation involved. A contractor can give you an exact price for your setup." },
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
      { title: "Barrier-Free Entry", desc: "Low or zero-threshold designs for stepping in." },
      { title: "Built-In Safety", desc: "Grab bars, fold-down seating, and slip-resistant floors." },
      { title: "Custom Glass & Tile", desc: "Frameless glass, tile, and fixtures tailored to your space." },
      { title: "Bench Seating", desc: "Built-in seating options for added comfort." },
      { title: "Storage Niches", desc: "Built-in niches for shampoo and shower essentials." }
    ],
    advantages: [
      { title: "Enhanced Safety", desc: "Low-threshold entry and grab bars can help reduce the risk of slips and falls." },
      { title: "Easy Accessibility", desc: "Barrier-free and ADA-compliant options make showering easier for many households." },
      { title: "Low Maintenance", desc: "Seamless walls and quality finishes resist mold and wipe clean easily." },
      { title: "Space Saving", desc: "Converting an old tub to a walk-in shower can open up a cramped bathroom." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does a walk-in shower cost?", answer: "Cost depends on size, materials, and whether it's a tub-to-shower conversion. A contractor can give you an exact price for your project." },
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
      { title: "Double & Triple Pane Options", desc: "Multi-pane windows with gas fills." },
      { title: "Custom Fit Installation", desc: "Measured and installed to fit your home's window openings." },
      { title: "Low-E Glass Coatings", desc: "Coatings that reduce UV rays and heat transfer." },
      { title: "Multi-Point Locking", desc: "Modern locking hardware on new window units." },
      { title: "Tilt-In Sashes", desc: "Sashes that tilt in for cleaning from inside your home." }
    ],
    advantages: [
      { title: "Lower Energy Bills", desc: "Energy-efficient windows can help reduce heating and cooling costs." },
      { title: "Noise Reduction", desc: "Multi-pane windows can help cut down on outside noise." },
      { title: "UV Protection", desc: "Low-E glass coatings can help block harmful UV rays." },
      { title: "Curb Appeal", desc: "New windows can refresh your home's exterior look." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much does window replacement cost?", answer: "Cost depends on the number of windows, materials, and installation complexity. A contractor can give you an exact price for your home." },
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
      { title: "Custom System Design", desc: "Solar systems designed around your roof layout and energy needs." },
      { title: "Panel Installation", desc: "Panels sized and positioned for your home." },
      { title: "Battery Storage Options", desc: "Add battery storage to keep power available during outages." },
      { title: "Net Metering Setup", desc: "Coordination with your utility for net metering where available." }
    ],
    advantages: [
      { title: "Reduce Energy Bills", desc: "Solar can help offset a portion of your monthly electricity costs." },
      { title: "Energy Independence", desc: "Generate your own power and rely less on the grid." },
      { title: "Low Maintenance", desc: "Solar panels require minimal upkeep and are built to last for decades." },
      { title: "Environmental Impact", desc: "Solar panels generate electricity without ongoing emissions." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews with unsourced figures and financing language (Categories 2/8/9E)
    faqs: [
      { question: "How much do solar panels cost?", answer: "Cost depends on your home's energy needs and the equipment used. A local installer can give you an exact quote, and a tax professional can walk you through any credits that may apply." },
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
      { title: "Seamless Gutters", desc: "Fabricated on-site for a fit with no seams to leak." },
      { title: "Gutter Guards", desc: "Guards that help keep leaves and debris out." },
      { title: "Downspout Systems", desc: "Drainage designed to direct water away from your foundation." },
      { title: "Repair Services", desc: "Fixes for leaks, sagging, and damaged sections." },
      { title: "Storm Damage Repair", desc: "Repairs for gutters damaged by storms." }
    ],
    advantages: [
      { title: "Foundation Protection", desc: "Gutters help channel water away from your foundation, reducing the risk of cracks and flooding." },
      { title: "Prevent Water Damage", desc: "Without gutters, water can cause staining, rot, and exterior damage over time." },
      { title: "Landscape Preservation", desc: "Controlled drainage can help prevent soil erosion around your landscaping." },
      { title: "Low Maintenance", desc: "Seamless gutters with guards need minimal cleaning." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      { question: "How much do new gutters cost?", answer: "Cost depends on the length of your home and the material used. A contractor can give you an exact price for your project." },
      { question: "How long does installation take?", answer: "Most gutter installations are completed in a single day." },
      { question: "Are gutter guards worth it?", answer: "Gutter guards can reduce how often you need to clean your gutters and help prevent clogs." },
      { question: "What material is best?", answer: "Aluminum is a popular choice for being lightweight, rust-resistant, and affordable, though the best option depends on your home and budget." }
    ]
  }
};
