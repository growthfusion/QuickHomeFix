/* ─── Service Landing Page Data ─── */
const serviceLandingData = {
  roof: {
    heroTitle: "Roofing Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request roofing quotes in your area.", // QHF-FIX: word change
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png",
    overviewImage: "images/landing/roof-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/roof-ov2.jpg",
    servicesTitle: "Roofing Services",
    serviceCards: [
      { img: "images/landing/services/roof-house.jpg", title: "Roof Replacement" },
      { img: "images/landing/services/roof-ov2.jpg", title: "Roof Repair & Inspection" },
      { img: "images/landing/services/roof-materials.jpg", title: "Asphalt, Metal & Tile" },
      { img: "images/landing/services/roof-tile.jpg", title: "Tile Roofing" },
      { img: "images/landing/services/roof-shake.jpg", title: "Shingle & Shake Roofing" },
      { img: "images/landing/services/roof-ventilation.jpg", title: "Ventilation & Insulation" }
    ],
   gallery: ["images/landing/roof-1.jpg","images/landing/roof-2.jpg","images/landing/roof-3.jpg"],
    overviewTitle: "Roof Repair & Replacement", // QHF-FIX: word change
    overviewSubtitle: "Roofing services available in your area:", // QHF-FIX: word change
    // ANGI EXHIBIT A COMPLIANCE: removed "Licensed & insured", "Free", "Warranty-backed", "Financing", "All roofing materials available" (Categories 1/2/8)
    overviewBenefits: ["Roofing services available","Roof inspection & estimates","Storm damage services","Wide range of roofing materials","Emergency leak repair available","Roof maintenance services"], // QHF-FIX: word change
    features: [
      // ANGI EXHIBIT A COMPLIANCE: removed "warranties" (Category 8)
      { title: "Roof Replacement", desc: "Old roof removed and new roof installed." }, // QHF-FIX: word change
      { title: "Leak Repair", desc: "Damaged areas repaired to stop leaks." }, // QHF-FIX: word change
      { title: "Roof Inspection", desc: "Roof checked for damage and wear." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Weather Protection", desc: "Keeps rain, wind, and heat out of your home." },
      { title: "Energy Efficiency", desc: "Good roofing helps maintain indoor temperature." },
      { title: "Durability", desc: "A new roof protects your home for years to come." },
      { title: "Curb Appeal", desc: "A clean roof improves the look of your home." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "How do I know if I need a new roof?", answer: "Look for missing shingles, leaks, or visible damage." },
      { question: "How long does a roof last?", answer: "It depends on the material and condition." },
      { question: "What types of roofing are available?", answer: "Asphalt, metal, tile, and flat roofing are common options." },
      { question: "Does weather affect my roof?", answer: "Yes, storms, wind, and heat can cause wear over time." }
    ]
  },
  bath: {
    heroTitle: "Bathroom Remodeling Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request bathroom quotes in your area.", // QHF-FIX: word change
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
    overviewImage: "images/landing/bath-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/hcb-overview.jpg",
    servicesTitle: "Bathroom Remodeling Services",
    serviceCards: [
      { img: "images/landing/services/hcb-replacement.jpg", title: "Shower & Bathtub Replacement" },
      { img: "images/landing/services/hcb-vanity.jpg", title: "Vanity & Sink Installation" },
      { img: "images/landing/services/hcb-shower.jpg", title: "Walk-In Shower Conversions" },
      { img: "images/landing/services/hcb-remodel.jpg", title: "Full Bathroom Remodel" },
      { img: "images/landing/services/hcb-tile.jpg", title: "Bathroom Flooring & Tile Installation" },
      { img: "images/landing/services/hcb-fixture.jpg", title: "Lighting & Fixture Upgrades" }
    ],
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Bathroom Remodeling & Renovation",
    overviewSubtitle: "Bathroom options available in your area:", // QHF-FIX: word change
    overviewBenefits: ["Available in most States","Bathroom remodeling options","Complete bathroom makeovers","Custom vanities & fixtures","Modern tile & flooring","Style and comfort options"], // QHF-FIX: word change
    features: [
      { title: "Custom Design", desc: "Personalized bathroom layouts tailored to your style, space, and daily needs." },
      { title: "Quality Fixtures", desc: "Premium faucets, showerheads, and hardware that combine style with durability." },
      { title: "Modern Tile & Flooring", desc: "Beautiful tile work for floors, walls, and showers with waterproof installation." }
    ],
    advantages: [
      { title: "Improved Functionality", desc: "A better layout can add storage, lighting, and fixtures where you need them." },
      { title: "Energy Efficiency", desc: "Low-flow fixtures, LED lighting, and efficient water heaters can help lower utility bills." },
      { title: "Updated Style", desc: "Swap outdated tile, vanities, and fixtures for a more modern look." },
      { title: "Better Storage", desc: "Custom cabinets, built-in shelving, and smarter storage options." },
      { title: "Enhanced Comfort", desc: "Options like heated floors and rain showerheads add everyday comfort." },
      { title: "Water Efficiency", desc: "Newer fixtures can help reduce water usage compared to older models." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "What is included in a bathroom remodel?", answer: "Tile, fixtures, vanity, shower, and layout changes." },
      { question: "What is a walk-in tub?", answer: "A tub with a door for easy entry without climbing." },
      { question: "Who is a walk-in shower good for?", answer: "Anyone who wants an easier, step-in shower with a low or no threshold." },
      { question: "How disruptive is a bathroom remodel?", answer: "Work is typically done room by room to minimise disruption." }
    ]
  },
  bathroom: {
    heroTitle: "Bathroom Remodeling Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request bathroom quotes in your area.", // QHF-FIX: word change
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
    overviewImage: "images/landing/bath-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/hcb-overview.jpg",
    servicesTitle: "Bathroom Remodeling Services",
    serviceCards: [
      { img: "images/landing/services/hcb-replacement.jpg", title: "Shower & Bathtub Replacement" },
      { img: "images/landing/services/hcb-vanity.jpg", title: "Vanity & Sink Installation" },
      { img: "images/landing/services/hcb-shower.jpg", title: "Walk-In Shower Conversions" },
      { img: "images/landing/services/hcb-remodel.jpg", title: "Full Bathroom Remodel" },
      { img: "images/landing/services/hcb-tile.jpg", title: "Bathroom Flooring & Tile Installation" },
      { img: "images/landing/services/hcb-fixture.jpg", title: "Lighting & Fixture Upgrades" }
    ],
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Bathroom Remodeling, Walk-In Tubs & Walk-In Showers",
    overviewSubtitle: "Bathroom options available in your area:", // QHF-FIX: word change
    overviewBenefits: ["Available in most States","Bathroom remodeling options","Complete bathroom remodeling","Walk-in tub & shower installation","Custom vanities & fixtures available","Style and comfort options"], // QHF-FIX: word change
    features: [
      { title: "Bathroom Remodeling", desc: "Full bathroom updated with new tile and fixtures." }, // QHF-FIX: word change
      { title: "Walk-In Tub", desc: "Tub with a door for easy and safe entry." }, // QHF-FIX: word change
      { title: "Walk-In Shower", desc: "Open shower with no step for easy access." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Improved Safety", desc: "Easier entry reduces the risk of slips and falls." },
      { title: "Modern Look", desc: "Updated bathrooms look clean and fresh." },
      { title: "Better Comfort", desc: "A better bathroom improves your daily routine." },
      { title: "Fresh Space", desc: "A remodeled bathroom makes daily routines more comfortable." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "What is included in a bathroom remodel?", answer: "Tile, fixtures, vanity, shower, and layout changes." },
      { question: "What is a walk-in tub?", answer: "A tub with a door for easy entry without climbing." },
      { question: "Who is a walk-in shower good for?", answer: "Anyone who wants an easier, step-in shower with a low or no threshold." },
      { question: "How disruptive is a bathroom remodel?", answer: "Work is typically done room by room to minimise disruption." }
    ]
  },
  tub: {
    heroTitle: "Walk-In Tub Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request walk-in tub quotes in your area.", // QHF-FIX: word change
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png",
    overviewImage: "images/landing/tub-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/hcb-remodel.jpg",
    servicesTitle: "Walk-In Tub Services",
    serviceCards: [
      { img: "images/landing/services/hcb-replacement.jpg", title: "Tub Replacement & Installation" },
      { img: "images/landing/services/hcb-fixture.jpg", title: "Fixtures & Grab Bars" },
      { img: "images/landing/services/hcb-tile.jpg", title: "Tile & Tub Surround" }
    ],
    gallery: ["images/landing/tub-1.jpg","images/landing/tub-2.jpg","images/landing/tub-3.jpg"],
    overviewTitle: "Walk-In Tub Installation & Conversion",
    overviewSubtitle: "Safe, comfortable bathing solutions for your home:",
    overviewBenefits: ["Available in most States","Walk-in tub options","Therapeutic hydrotherapy jets","Low step-in entry door","Built-in safety features","Accessibility options"], // QHF-FIX: word change
    features: [
      { title: "Walk-In Tub", desc: "Tub with a door so no climbing is needed." }, // QHF-FIX: word change
      { title: "Hydrotherapy Jets", desc: "Jets that help relax muscles and joints." }, // QHF-FIX: word change
      { title: "Safety Features", desc: "Grab bars and non-slip floor included." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Safe Entry", desc: "Door entry removes the need to step over the tub wall." },
      { title: "Comfortable Soak", desc: "Jets help soothe muscles and improve relaxation." },
      { title: "Easy to Use", desc: "Simple design for independent and comfortable bathing." },
      { title: "Peace of Mind", desc: "Built-in safety features reduce the risk of accidents." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "What is a walk-in tub?", answer: "A tub with a door so you do not have to climb over the side." },
      { question: "How do you get in a walk-in tub?", answer: "Through a door in the side, so there is no high wall to climb over." },
      { question: "What are hydrotherapy jets?", answer: "Water jets that help relax muscles and joints." },
      { question: "Are safety features included?", answer: "Most models include grab bars and non-slip flooring." }
    ]
  },
  shower: {
    heroTitle: "Walk-In Shower Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request walk-in shower quotes in your area.", // QHF-FIX: word change
    heroImage: "images/walk-in-shower.png",
    overviewImage: "images/landing/bath-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/hcb-shower.jpg",
    servicesTitle: "Walk-In Shower Services",
    serviceCards: [
      { img: "images/landing/services/hcb-replacement.jpg", title: "Tub-to-Shower Conversions" },
      { img: "images/landing/services/hcb-tile.jpg", title: "Shower Tile & Glass" },
      { img: "images/landing/services/hcb-fixture.jpg", title: "Showerheads & Fixtures" }
    ],
    gallery: ["images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg"],
    overviewTitle: "Walk-In Shower Installation & Conversion",
    overviewSubtitle: "Safe, low-maintenance walk-in showers for accessibility and style:", // QHF-FIX: word change
    overviewBenefits: ["Available in most States","Shower remodeling options","Low-threshold, curbless entry","Built-in seating & grab bars","Anti-slip flooring options","Modern glass & tile finishes"], // QHF-FIX: word change
    features: [
      { title: "Walk-In Shower", desc: "Shower with no step or barrier at entry." }, // QHF-FIX: word change
      { title: "Curbless Entry", desc: "Flat floor entry for full accessibility." }, // QHF-FIX: word change
      { title: "Custom Finishes", desc: "Tile and glass options in many styles." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Easy Access", desc: "No step makes getting in and out simple." },
      { title: "Modern Look", desc: "Open showers give a clean, spacious feel." },
      { title: "Easy Cleaning", desc: "Simple design is easy to keep clean." },
      { title: "Accessibility", desc: "Good option for anyone with mobility needs." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "What is a walk-in shower?", answer: "A shower with no step or barrier for easy access." },
      { question: "Can I convert my bathtub to a shower?", answer: "Yes, this is a common bathroom upgrade." },
      { question: "What finishes are available?", answer: "Tile, glass, and fixture options in many styles." },
      { question: "Are walk-in showers easy to clean?", answer: "Yes, the open design makes cleaning simple." }
    ]
  },
  windows: {
    heroTitle: "Window Replacement Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request window quotes in your area.", // QHF-FIX: word change
    heroImage: "images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png",
    overviewImage: "images/landing/window-1.jpg",
    // Original (non-variant) page only: HouseCrew-style photo overview + image-card grid
    overviewPhoto: "images/landing/services/win-modern.jpg",
    servicesTitle: "Window Services",
    serviceCards: [
      { img: "images/landing/services/win-house.jpg", title: "Window Replacement" },
      { img: "images/landing/services/win-white.jpg", title: "Double-Hung Windows" },
      { img: "images/landing/services/win-living.jpg", title: "Picture & Bay Windows" },
      { img: "images/landing/services/win-bright.jpg", title: "Casement & Sliding Windows" },
      { img: "images/landing/services/win-sill.jpg", title: "Energy-Efficient Glass" },
      { img: "images/landing/services/win-frame2.jpg", title: "Wood & Vinyl Frames" }
    ],
   gallery: ["images/landing/window-1.jpg","images/landing/window-2.jpg","images/landing/window-3.jpg"],
    overviewTitle: "Window Replacement & Installation",
    overviewSubtitle: "Window options available in your area:", // QHF-FIX: word change
    overviewBenefits: ["Energy-efficient options","Noise reduction technology","UV protection coatings","Custom window sizes & styles","Window installation available"], // QHF-FIX: word change
    features: [
      { title: "Window Replacement", desc: "Old windows removed and new ones fitted." }, // QHF-FIX: word change
      { title: "Custom Sizing", desc: "Windows sized to fit your exact openings." }, // QHF-FIX: word change
      // ANGI EXHIBIT A COMPLIANCE: removed "Special" (Category 8)
      { title: "Glass Options", desc: "Single, double, and triple pane available." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Energy Savings", desc: "New windows reduce heat and cold coming in." },
      { title: "Noise Reduction", desc: "Thicker glass reduces outside noise." },
      { title: "UV Protection", desc: "Low-E glass blocks most UV rays." },
      { title: "Curb Appeal", desc: "New windows improve the look of your home." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "How do I know if I need new windows?", answer: "Look for drafts, condensation, or difficulty opening." },
      { question: "What is a double pane window?", answer: "Two layers of glass for better insulation." },
      { question: "Do new windows save energy?", answer: "Yes, modern windows reduce heating and cooling loss." },
      { question: "Are custom sizes available?", answer: "Yes, windows can be fitted to any opening." }
    ]
  },
  solar: {
    heroTitle: "Solar Installation Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request solar quotes in your area.", // QHF-FIX: word change
    heroImage: null,
    overviewImage: "images/landing/solar-1.jpg",
    overviewPhoto: "images/landing/services/solar-ov.jpg",
    servicesTitle: "Solar Services",
    serviceCards: [
      { img: "images/landing/services/solar-roof.jpg", title: "Rooftop Solar Installation" },
      { img: "images/landing/services/solar-panels.jpg", title: "Solar Panel Systems" },
      { img: "images/landing/services/solar-house2.jpg", title: "Home Solar Upgrades" },
      { img: "images/landing/services/solar-tile.jpg", title: "Solar on Tile Roofs" },
      { img: "images/landing/services/solar-tile2.jpg", title: "Solar Panel Replacement" },
      { img: "images/landing/services/solar-home.jpg", title: "Solar for Every Home Style" }
    ],
    gallery: ["images/landing/solar-1.jpg","images/landing/solar-2.jpg","images/landing/solar-3.jpg"],
    overviewTitle: "Solar Panel Installation & Energy Solutions",
    overviewSubtitle: "Solar options available in your area:", // QHF-FIX: word change
    // ANGI EXHIBIT A COMPLIANCE: removed "Federal", "warranties", unsourced savings figure, and tax-credit claim (Categories 2/4/8)
    overviewBenefits: ["Lower electricity usage","Clean, renewable energy","Custom system design","Battery storage options","Net metering options"], // QHF-FIX: word change
    features: [
      { title: "Panel Installation", desc: "Solar panels fitted to your roof." }, // QHF-FIX: word change
      { title: "Energy Savings", desc: "Reduces your monthly electricity usage." }, // QHF-FIX: word change
      { title: "Battery Storage", desc: "Stores power for use when needed." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Lower Bills", desc: "Solar reduces your electricity costs." },
      { title: "Clean Energy", desc: "No ongoing emissions from solar power." },
      { title: "Energy Independence", desc: "Generate your own power instead of relying on the grid." },
      { title: "Low Maintenance", desc: "Very little upkeep needed after installation." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews with unsourced figures and financing language (Categories 2/8/9E)
    faqs: [
      // QHF-FIX: word change
      { question: "How do solar panels work?", answer: "They convert sunlight into electricity for your home." },
      { question: "Do solar panels work on cloudy days?", answer: "Yes, they still generate power in low light." },
      { question: "How much roof space is needed?", answer: "It depends on your home size and energy use." },
      { question: "Are solar panels low maintenance?", answer: "Yes, they require very little upkeep." }
    ]
  },
  gutter: {
    heroTitle: "Gutter Installation Quotes Near You", // QHF-FIX: word change
    heroSubtitle: "Enter your ZIP Code to request gutter quotes in your area.", // QHF-FIX: word change
    heroImage: null,
    overviewImage: "images/landing/gutter-1.jpg",
    overviewPhoto: "images/landing/services/gut-ov.jpg",
    servicesTitle: "Gutter Services",
    serviceCards: [
      { img: "images/landing/services/gut-corner.jpg", title: "Gutter Installation" },
      { img: "images/landing/services/gut-seamless.jpg", title: "Seamless Gutters" },
      { img: "images/landing/services/gut-close.jpg", title: "Gutter Repair & Cleaning" },
      { img: "images/landing/services/gut-rain.jpg", title: "Downspouts & Drainage" },
      { img: "images/landing/services/gut-replace.jpg", title: "Gutter Replacement" },
      { img: "images/landing/services/gut-home.jpg", title: "Whole-Home Gutter Systems" }
    ],
    gallery: ["images/landing/gutter-1.jpg","images/landing/gutter-2.jpg","images/landing/gutter-3.jpg"],
    overviewTitle: "Gutter Installation, Repair & Guards",
    overviewSubtitle: "Protect your home from water damage:",
    // ANGI EXHIBIT A COMPLIANCE: removed "Free", "All materials available" (Category 1)
    overviewBenefits: ["Seamless gutter systems available","Gutter guard installation available","Storm damage repair available","Downspout solutions","Gutter guard options"], // QHF-FIX: word change
    features: [
      { title: "Gutter Installation", desc: "New gutters fitted along your roofline." }, // QHF-FIX: word change
      { title: "Gutter Guards", desc: "Covers that keep debris out of gutters." }, // QHF-FIX: word change
      { title: "Downspout Systems", desc: "Directs water away from your home." } // QHF-FIX: word change
    ],
    advantages: [
      // QHF-FIX: word change
      { title: "Home Protection", desc: "Gutters keep water away from your walls and foundation." },
      { title: "Less Cleaning", desc: "Gutter guards reduce how often you need to clean." },
      { title: "Better Drainage", desc: "Water flows away properly with a good gutter system." },
      { title: "Curb Appeal", desc: "Clean gutters improve the appearance of your home." }
    ],
    // ANGI EXHIBIT A COMPLIANCE: removed fabricated testimonial reviews (Category 9E — no contractor name/location; render block removed)
    faqs: [
      // QHF-FIX: word change
      { question: "Why do I need gutters?", answer: "They direct rainwater away from your home foundation." },
      { question: "What are gutter guards?", answer: "Covers that stop leaves and debris blocking your gutters." },
      { question: "How often should gutters be cleaned?", answer: "At least twice a year is recommended." },
      { question: "What is a seamless gutter?", answer: "A single piece gutter with no joints to reduce leaks." }
    ]
  }
};
