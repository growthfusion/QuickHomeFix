/* ═══ STEP CONFIGURATIONS ═══ */
const radioStepConfigs = {
  "roofing-type": { title: "What type of roofing service do you need?", field: "roofingType", options: [
    { id: "Roof Replace", name: "Replace" }, { id: "Roof Repair", name: "Repair" }, { id: "New Construction", name: "Install" }
  ]},
  "material": { title: "What type of roofing material are you looking for?", field: "material", options: [
    { id: "asphalt", name: "Asphalt" }, { id: "metal", name: "Metal" }, { id: "tile", name: "Tile" },
    { id: "slate", name: "Natural Slate" }, { id: "wood", name: "Cedar Shake" }, { id: "composite", name: "Composite" }, { id: "tar", name: "Tar/Torchdown" }
  ]},
  "window-type": { title: "What is the nature of your windows project?", field: "windowType", options: [
    { id: "Install", name: "Install" }, { id: "Repair", name: "Repair" }
  ]},
  "window-count": { title: "How many windows are involved?", field: "windowCount", options: [
    { id: "1", name: "1" }, { id: "2", name: "2" }, { id: "3-5", name: "3-5" }, { id: "6-9", name: "6-9" }
  ]},
  "solar-type": { title: "What type of solar solution do you need?", field: "solarType", options: [
    { id: "solarInstall", name: "Solar Install" }, { id: "solarRepair", name: "Solar Repair" }, { id: "solarUpgrade", name: "Solar Upgrade" }
  ]},
  "roof-size": { title: "What is your average monthly electric bill?", field: "electricBill", options: [
    { id: "Under $100", name: "Under $100" }, { id: "$100 - $200", name: "$100 - $200" },
    { id: "$200 - $300", name: "$200 - $300" }, { id: "$300+", name: "$300+" }
  ]},
  "bathroom-wall": { title: "Need to remove or add walls for bath remodel?", field: "bathwallType", options: [
    { id: "Yes", name: "Yes" }, { id: "No", name: "No" }
  ]},
  "gutter-type": { title: "What type of gutter service do you need?", field: "gutterType", options: [
    { id: "Install", name: "Install" }, { id: "Repair", name: "Repair" }
  ]},
  "gutter-material": { title: "Select Gutter Material", field: "gutterMaterial", options: [
    { id: "Copper", name: "Copper" }, { id: "Galvanized", name: "Galvanized" }, { id: "PVC", name: "PVC" },
    { id: "Seamless Metal", name: "Seamless Metal" }, { id: "Wood", name: "Wood" }
  ]},
  "tub-reason": { title: "What's the biggest reason you are considering a walk-in tub?", field: "tubReason", options: [
    { id: "safety", name: "For Safety" }, { id: "therapeutic", name: "For Therapeutic Reasons" }, { id: "other", name: "Other Reasons" }
  ]},
  "walk": { title: "What type of Walk-In tub", field: "walkinType", options: [
    { id: "replace", name: "Replace Walk-In Tub" }, { id: "install", name: "Install Walk-In Tub" }, { id: "repair", name: "Repair Walk-In Tub" }
  ]},
};

const serviceImages = {
  roof: "images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png",
  windows: "images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png",
  bath: "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
  tub: "images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png",
};

const serviceSubtitles = {
  roof: "Enter your ZIP to find roofing pros near you",
  windows: "Enter your ZIP to find window pros near you",
  bath: "Enter your ZIP to find bath remodeling pros near you",
  tub: "Enter your ZIP to find walk-in tub pros near you",
};

const services = [
  { id: "roof", name: "Roof Services", image: "images/roof.png", popular: false },
  { id: "windows", name: "Windows", image: "images/window.png", popular: true },
  { id: "bath", name: "Bath Remodeling", image: "images/bath-tub.png", popular: false },
  { id: "solar", name: "Solar Energy", image: "images/solar-panel.png", popular: false },
  { id: "gutter", name: "Gutter Services", image: "images/round.png", popular: false },
  { id: "tub", name: "Walk-In-Tub", image: "images/buket.png", popular: false },
  { id: "shower", name: "Walk-In-Shower", image: "images/showerr.png", popular: false },
];

let currentRadioField = "";
let currentRadioValue = "";
let currentLandingService = "";
let showingLanding = false;

/* ═══ INIT ═══ */
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("trustDate").textContent = new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"});
  buildServiceCards();

  const params = new URLSearchParams(window.location.search);
  const svc = params.get("service");
  if (svc && isValidService(svc)) {
    currentLandingService = svc;
    // Check if landing data exists for this service
    if (serviceLandingData[svc]) {
      showLandingPage(svc);
    } else {
      store.updateFormData("service", svc);
      store.setStep(1);
      showWizard();
      renderCurrentStep();
    }
  } else {
    store.setStep(0);
    showWizard();
    renderCurrentStep();
  }

  // ZIP input
  document.getElementById("zipInput").addEventListener("input", function() {
    this.value = this.value.replace(/\D/g,"").substring(0,5);
    document.getElementById("zipNextBtn").disabled = this.value.length < 5;
    document.getElementById("zipError").classList.add("hidden");
    if (this.value.length === 5) {
      this.style.borderColor = "#4ade80";
    } else {
      this.style.borderColor = "#e5e7eb";
    }
  });

  // Landing ZIP input
  document.getElementById("landingZipInput").addEventListener("input", function() {
    this.value = this.value.replace(/\D/g,"").substring(0,5);
  });

  // Phone input formatting
  document.getElementById("phoneInput").addEventListener("input", function() {
    this.value = formatPhone(this.value);
    document.getElementById("phoneError").classList.add("hidden");
  });
});

/* ═══ LANDING PAGE ═══ */
function showLandingPage(svc) {
  showingLanding = true;
  var data = serviceLandingData[svc];
  if (!data) return;

  document.getElementById("landingPage").style.display = "flex";
  document.getElementById("wizardContainer").style.display = "none";

  // Hero
  document.getElementById("landingHeroTitle").textContent = data.heroTitle;
  document.getElementById("landingHeroSubtitle").textContent = data.heroSubtitle;
  var heroImgEl = document.getElementById("landingHeroImage");
  if (data.heroImage) {
    heroImgEl.innerHTML = '<img src="'+data.heroImage+'" alt="'+data.heroTitle+'" loading="eager" decoding="async" class="w-full h-auto object-contain drop-shadow-xl" />';
  } else if (data.gallery && data.gallery.length > 0) {
    heroImgEl.innerHTML = '<div class="hidden lg:block rounded-lg overflow-hidden border border-gray-200"><img src="'+data.gallery[0]+'" alt="Project" class="w-full h-64 lg:h-72 object-cover" /></div>';
  } else {
    heroImgEl.innerHTML = "";
  }

  // Overview
  document.getElementById("landingOverviewTitle").textContent = data.overviewTitle;
  document.getElementById("landingOverviewSubtitle").textContent = data.overviewSubtitle;
  var overviewImgEl = document.getElementById("landingOverviewImage");
  if (data.overviewImage) {
    overviewImgEl.innerHTML = '<img src="'+data.overviewImage+'" alt="'+data.overviewTitle+'" loading="lazy" decoding="async" class="w-full h-48 sm:h-64 lg:h-72 object-cover" />';
  }
  var benefitsEl = document.getElementById("landingOverviewBenefits");
  benefitsEl.innerHTML = "";
  data.overviewBenefits.forEach(function(b) {
    benefitsEl.innerHTML += '<div class="flex items-start gap-2.5"><svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="text-[15px] text-gray-800 leading-relaxed">'+b+'</span></div>';
  });

  // Features
  var featEl = document.getElementById("landingFeatures");
  featEl.innerHTML = "";
  data.features.forEach(function(f, i) {
    featEl.innerHTML += '<div class="bg-white rounded-lg border border-gray-200 p-5"><div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3"><span class="text-base font-bold text-blue-600">'+String(i+1).padStart(2,"0")+'</span></div><h3 class="text-base font-bold text-gray-900 mb-1.5">'+f.title+'</h3><p class="text-[15px] text-gray-600 leading-relaxed">'+f.desc+'</p></div>';
  });

  // Advantages
  var advEl = document.getElementById("landingAdvantages");
  advEl.innerHTML = "";
  data.advantages.forEach(function(a) {
    advEl.innerHTML += '<div class="flex gap-3 p-4 rounded-lg border border-gray-200"><div class="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><svg class="w-[18px] h-[18px] text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div class="min-w-0"><h3 class="text-base font-bold text-gray-900 mb-1">'+a.title+'</h3><p class="text-[15px] text-gray-600 leading-relaxed">'+a.desc+'</p></div></div>';
  });

  // Gallery
  if (data.gallery && data.gallery.length > 0) {
    document.getElementById("landingGallerySection").classList.remove("hidden");
    var galEl = document.getElementById("landingGallery");
    galEl.innerHTML = "";
    data.gallery.forEach(function(img, i) {
      galEl.innerHTML += '<div class="rounded-xl overflow-hidden border border-gray-200 group cursor-pointer"><img src="'+img+'" alt="Project '+(i+1)+'" loading="lazy" class="w-full h-24 sm:h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-300" /></div>';
    });
  }

  // Reviews
  var revEl = document.getElementById("landingReviews");
  revEl.innerHTML = "";
  data.reviews.forEach(function(r) {
    var stars = "";
    for (var s=0; s<5; s++) {
      stars += '<svg class="w-5 h-5 '+(s < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200')+'" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
    }
    var avatarHtml = r.avatar
      ? '<img src="'+r.avatar+'" alt="'+r.name+'" class="w-10 h-10 rounded-full object-cover border-2 border-gray-100" loading="lazy" />'
      : '<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><span class="text-sm font-bold text-blue-600">'+r.name[0]+'</span></div>';
    revEl.innerHTML += '<div class="bg-white rounded-lg border border-gray-200 p-5"><div class="flex gap-0.5">'+stars+'</div><p class="text-[15px] text-gray-700 leading-relaxed mt-3 mb-4">"'+r.text+'"</p><div class="flex items-center gap-2.5">'+avatarHtml+'<div><span class="text-[15px] font-bold text-gray-900 block">'+r.name+'</span><span class="text-xs text-gray-400">Verified Homeowner</span></div></div></div>';
  });

  // FAQs
  var faqEl = document.getElementById("landingFaqs");
  faqEl.innerHTML = "";
  data.faqs.forEach(function(f, i) {
    faqEl.innerHTML += '<div class="border border-gray-200 rounded-lg"><button type="button" onclick="toggleLandingFaq('+i+')" class="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left"><span class="text-base font-semibold text-gray-900 leading-snug">'+f.question+'</span><svg id="lfaqChevron'+i+'" class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button><div id="lfaqAnswer'+i+'" class="hidden px-4 sm:px-6 pb-4 animate-expand"><p class="text-[15px] text-gray-600 leading-relaxed">'+f.answer+'</p></div></div>';
  });

  window.scrollTo({top:0, behavior:"instant"});
}

function toggleLandingFaq(i) {
  document.getElementById("lfaqAnswer"+i).classList.toggle("hidden");
  document.getElementById("lfaqChevron"+i).classList.toggle("rotate-180");
}

function startWizardFromLanding() {
  var zip = document.getElementById("landingZipInput").value.replace(/\D/g,"");
  store.updateFormData("service", currentLandingService);

  if (zip && zip.length === 5) {
    store.updateFormData("zipcode", zip);
    // Skip the zipcode step
    var flow = getServiceFlow(currentLandingService);
    var zipIdx = flow.steps.indexOf("zipcode");
    if (zipIdx !== -1 && zipIdx + 1 < flow.steps.length) {
      store.setStep(zipIdx + 2);
    } else {
      store.setStep(1);
    }
  } else {
    store.setStep(1);
  }

  showingLanding = false;
  showWizard();
  renderCurrentStep();
}

function showWizard() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("wizardContainer").style.display = "block";
}

/* Fix back button display */

function formatPhone(val) {
  const cleaned = val.replace(/\D/g,"");
  const m = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!m) return val;
  let f = "";
  if (m[1]) { f = "(" + m[1]; if (m[1].length===3) f += ") "; }
  if (m[2]) { f += m[2]; if (m[2].length===3) f += "-"; }
  if (m[3]) f += m[3];
  return f;
}

/* ═══ RENDER ═══ */
function renderCurrentStep() {
  // Hide all
  document.querySelectorAll(".wizard-step").forEach(s => s.classList.remove("active"));
  const step = store.currentStep;
  const flow = getServiceFlow(store.formData.service);

  // Back button
  const backBtn = document.getElementById("backBtn");
  backBtn.style.display = step > 1 ? "inline-flex" : "none";

  // Trust badge visibility
  const trust = document.getElementById("trustBadge");
  const stepName = store.getCurrentStepName();

  if (step === 0) {
    document.getElementById("step-service-selection").classList.add("active");
    trust.style.display = "none";
    return;
  }

  if (!stepName) {
    document.getElementById("step-service-selection").classList.add("active");
    trust.style.display = "none";
    return;
  }

  trust.style.display = (stepName === "complete" || stepName === "service-selection") ? "none" : "block";
  const progress = store.getProgress();

  if (stepName === "zipcode") {
    document.getElementById("step-zipcode").classList.add("active");
    document.getElementById("progressZip").style.width = progress + "%";
    const img = serviceImages[store.formData.service];
    const imgEl = document.getElementById("zipHeroImg");
    imgEl.innerHTML = img ? '<img src="'+img+'" alt="'+store.formData.service+'" class="w-full max-h-64 sm:max-h-72 lg:max-h-80 h-auto object-contain" />' : "";
    document.getElementById("zipSubtitle").textContent = serviceSubtitles[store.formData.service] || "";
    document.getElementById("zipInput").value = store.formData.zipcode || "";
    document.getElementById("zipNextBtn").disabled = (store.formData.zipcode||"").length < 5;
  } else if (stepName === "email") {
    document.getElementById("step-email").classList.add("active");
    document.getElementById("progressEmail").style.width = progress + "%";
    document.getElementById("emailInput").value = store.formData.email || "";
  } else if (stepName === "details") {
    document.getElementById("step-details").classList.add("active");
    document.getElementById("progressDetails").style.width = progress + "%";
    document.getElementById("addressInput").value = store.formData.address || "";
    document.getElementById("cityInput").value = store.formData.city || "";
    document.getElementById("stateInput").value = store.formData.state || "";
    document.getElementById("detailZipInput").value = store.formData.zipcode || "";
  } else if (stepName === "name") {
    document.getElementById("step-name").classList.add("active");
    document.getElementById("progressName").style.width = progress + "%";
    document.getElementById("firstNameInput").value = store.formData.firstName || "";
    document.getElementById("lastNameInput").value = store.formData.lastName || "";
  } else if (stepName === "final") {
    document.getElementById("step-final").classList.add("active");
    document.getElementById("phoneInput").value = store.formData.phone || "";
  } else if (stepName === "complete") {
    document.getElementById("step-complete").classList.add("active");
    backBtn.style.display = "none";
    var svcMap = { windows:"window", solar:"solar energy", bath:"bath remodeling", gutter:"gutter service", shower:"walk-in shower", tub:"walk-in tub" };
    var label = svcMap[store.formData.service] || "roofing";
    document.getElementById("completeMessage").textContent = "A specialist will review your " + label + " project and contact you within 24 hours with a free, no-obligation quote.";
    buildUpsellCards();
  } else if (radioStepConfigs[stepName]) {
    renderRadioStep(stepName, progress);
  }

  // Scroll top
  window.scrollTo({top:0,behavior:"instant"});
  document.getElementById("wizardContainer").scrollTo({top:0,behavior:"instant"});
}

function renderRadioStep(stepName, progress) {
  const config = radioStepConfigs[stepName];
  document.getElementById("step-radio").classList.add("active");
  document.getElementById("progressRadio").style.width = progress + "%";
  document.getElementById("radioTitle").textContent = config.title;
  currentRadioField = config.field;
  currentRadioValue = store.formData[config.field] || "";

  const container = document.getElementById("radioOptions");
  container.innerHTML = "";
  config.options.forEach(function(opt, idx) {
    const isLast = idx === config.options.length - 1;
    const isSelected = currentRadioValue === opt.id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "w-full flex items-center gap-3 px-5 py-4 text-left transition-colors " +
      (!isLast ? "border-b border-gray-200 " : "") +
      (isSelected ? "bg-blue-50" : "bg-white");
    btn.innerHTML = '<div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' +
      (isSelected ? 'border-blue-600' : 'border-gray-300') + '">' +
      (isSelected ? '<div class="w-2.5 h-2.5 rounded-full bg-blue-600"></div>' : '') +
      '</div><span class="font-medium text-base ' +
      (isSelected ? 'text-blue-600' : 'text-gray-800') + '">' + opt.name + '</span>';
    btn.onclick = function() {
      currentRadioValue = opt.id;
      store.updateFormData(config.field, opt.id);
      renderRadioStep(stepName, progress);
      document.getElementById("radioNextBtn").disabled = false;
    };
    container.appendChild(btn);
  });

  document.getElementById("radioNextBtn").disabled = !currentRadioValue;
}

/* ═══ SERVICE CARDS ═══ */
function buildServiceCards() {
  const container = document.getElementById("serviceCards");
  services.forEach(function(svc) {
    const div = document.createElement("div");
    div.onclick = function() { selectService(svc.id); };
    div.className = "relative bg-white rounded-xl border border-gray-200 cursor-pointer flex items-center gap-4 px-6 py-5 sm:px-8 sm:py-6 card-smooth transition-shadow duration-200 hover:shadow-md";
    div.innerHTML = '<div class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-50"><img src="'+svc.image+'" alt="'+svc.name+'" class="w-10 h-10 sm:w-12 sm:h-12 object-contain" loading="lazy" /></div>' +
      '<h3 class="font-semibold text-base sm:text-lg text-gray-800">'+svc.name+'</h3>' +
      (svc.popular ? '<span class="ml-auto bg-blue-600 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0">Popular</span>' : '');
    container.appendChild(div);
  });
}

function selectService(id) {
  store.resetAll();
  store.updateFormData("service", id);
  store.setStep(1);
  renderCurrentStep();
}

/* ═══ STEP HANDLERS ═══ */
function wizardBack() {
  store.prevStep();
  if (store.currentStep === 0) {
    renderCurrentStep();
  } else {
    renderCurrentStep();
  }
}

function submitZipcode() {
  var zip = document.getElementById("zipInput").value;
  if (!zip || zip.length < 5) {
    document.getElementById("zipError").textContent = "Please enter a valid 5-digit zip code";
    document.getElementById("zipError").classList.remove("hidden");
    return;
  }
  store.updateFormData("zipcode", zip);
  trackMetaEvent("zipcode", "Enter Your Zip Code", zip);
  // Lookup city/state in background
  lookupZipcode(zip).then(function(loc) {
    if (loc) {
      store.updateFormData("city", loc.city);
      store.updateFormData("state", loc.state);
    }
  });
  store.nextStep();
  renderCurrentStep();
}

function submitRadioStep() {
  if (!currentRadioValue) return;
  store.nextStep();
  renderCurrentStep();
}

function submitEmail(e) {
  e.preventDefault();
  var email = document.getElementById("emailInput").value.trim();
  if (!email) { showEmailError("Email is required"); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showEmailError("Please enter a valid email"); return; }

  var btn = document.getElementById("emailNextBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner mr-2"></span>Verifying...';

  verifyEmail(email)
    .then(function(result) {
      if (result && result.format_valid === false) {
        showEmailError(result.message || "Invalid email format.");
        btn.disabled = false; btn.textContent = "Next";
      } else {
        store.updateFormData("email", email);
        trackMetaEvent("email", "Please Enter Your Email", email);
        btn.disabled = false; btn.textContent = "Next";
        store.nextStep();
        renderCurrentStep();
      }
    })
    .catch(function() {
      // API unavailable — proceed with client-side validation
      store.updateFormData("email", email);
      trackMetaEvent("email", "Please Enter Your Email", email);
      btn.disabled = false; btn.textContent = "Next";
      store.nextStep();
      renderCurrentStep();
    });
}

function showEmailError(msg) {
  document.getElementById("emailError").textContent = msg;
  document.getElementById("emailError").classList.remove("hidden");
}

var _addrDebounce = null;
// Address autocomplete
document.addEventListener("DOMContentLoaded", function() {
  var addrInput = document.getElementById("addressInput");
  if (addrInput) {
    addrInput.addEventListener("input", function() {
      var val = this.value;
      clearTimeout(_addrDebounce);
      if (!val || val.length < 3) { hideSuggestions(); return; }
      _addrDebounce = setTimeout(function() {
        placesAutocomplete(val).then(function(data) {
          var preds = (data && data.predictions) || [];
          showSuggestions(preds);
        }).catch(function() { hideSuggestions(); });
      }, 400);
    });
    addrInput.addEventListener("blur", function() { setTimeout(hideSuggestions, 200); });
  }
});

function showSuggestions(predictions) {
  var existing = document.getElementById("addrSuggestions");
  if (existing) existing.remove();
  if (!predictions.length) return;
  var div = document.createElement("div");
  div.id = "addrSuggestions";
  div.className = "absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-60 overflow-auto";
  predictions.forEach(function(p) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "block w-full text-left px-3 py-2 text-sm hover:bg-gray-50";
    btn.textContent = p.description;
    btn.onmousedown = function(e) {
      e.preventDefault();
      applySuggestion(p);
    };
    div.appendChild(btn);
  });
  var parent = document.getElementById("addressInput").parentElement.parentElement;
  parent.appendChild(div);
}

function hideSuggestions() {
  var el = document.getElementById("addrSuggestions");
  if (el) el.remove();
}

function applySuggestion(suggestion) {
  document.getElementById("addressInput").value = suggestion.description;
  store.updateFormData("address", suggestion.description);
  hideSuggestions();
  if (!suggestion.place_id) return;
  placeDetails(suggestion.place_id).then(function(data) {
    if (data.street) { document.getElementById("addressInput").value = data.street; store.updateFormData("address", data.street); }
    if (data.city) { document.getElementById("cityInput").value = data.city; store.updateFormData("city", data.city); }
    if (data.state) { document.getElementById("stateInput").value = data.state.toUpperCase(); store.updateFormData("state", data.state.toUpperCase()); }
    if (data.zipcode) { document.getElementById("detailZipInput").value = data.zipcode; store.updateFormData("zipcode", data.zipcode); }
  }).catch(function() {});
}

function submitDetails(e) {
  e.preventDefault();
  var addr = document.getElementById("addressInput").value;
  var city = document.getElementById("cityInput").value;
  var state = document.getElementById("stateInput").value;
  var zip = document.getElementById("detailZipInput").value;
  if (!addr || !city || !state || !zip) { alert("Please fill in all fields"); return; }
  store.updateFormData("address", addr);
  store.updateFormData("city", city);
  store.updateFormData("state", state.toUpperCase());
  store.updateFormData("zipcode", zip);
  store.updateFormData("isOwner", true);
  trackMetaEvent("AddressDetails", "Property Address", addr+", "+city+", "+state+" "+zip);
  trackSnapEvent("AddressDetails", { description: "Property Address", item_category: addr+", "+city+", "+state+" "+zip });
  store.nextStep();
  renderCurrentStep();
}

function setOwner(val) {
  store.updateFormData("isOwner", val);
  document.getElementById("ownerYes").className = "w-14 py-1.5 rounded-md border text-xs font-bold " + (val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200");
  document.getElementById("ownerNo").className = "w-14 py-1.5 rounded-md border text-xs font-bold " + (!val ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200");
}

function submitName(e) {
  e.preventDefault();
  const fn = document.getElementById("firstNameInput").value;
  const ln = document.getElementById("lastNameInput").value;
  if (!fn || !ln) return;
  store.updateFormData("firstName", fn);
  store.updateFormData("lastName", ln);
  trackMetaEvent("name", "Enter Your Name", fn+" "+ln);
  store.nextStep();
  renderCurrentStep();
}

function submitFinal(e) {
  e.preventDefault();
  var phone = document.getElementById("phoneInput").value;
  if (!phone) { showPhoneError("Phone number is required"); return; }
  var digits = phone.replace(/\D/g,"");
  if (digits.length < 10) { showPhoneError("Please enter a complete 10-digit phone number"); return; }

  var btn = document.getElementById("finalSubmitBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner mr-2"></span>Submitting...';
  store.updateFormData("phone", phone);

  // Verify phone, then submit lead
  verifyPhone(digits)
    .then(function(result) {
      if (result && result.valid === false) {
        showPhoneError("Please enter a valid US phone number.");
        btn.disabled = false; btn.textContent = "Submit";
        return;
      }
      return doLeadSubmit(phone, btn);
    })
    .catch(function() {
      // API unavailable — proceed
      return doLeadSubmit(phone, btn);
    });
}

function doLeadSubmit(phone, btn) {
  trackMetaEvent("PhoneNumber", "Enter Your Phone Number", phone);
  trackSnapEvent("PhoneNumber", { description: "Enter Your Phone Number", item_category: phone });

  // Submit the lead to backend
  submitFullLead(store.formData)
    .then(function(result) {
      if (result) store.state.leadResponse = result;
      btn.disabled = false; btn.textContent = "Submit";
      store.nextStep();
      renderCurrentStep();
    })
    .catch(function() {
      btn.disabled = false; btn.textContent = "Submit";
      store.nextStep();
      renderCurrentStep();
    });
}

function showPhoneError(msg) {
  document.getElementById("phoneError").textContent = msg;
  document.getElementById("phoneError").classList.remove("hidden");
}

/* ═══ UPSELL CARDS (complete step) ═══ */
var upsellServiceData = {
  roof:    { name:"Roofing",        key:"roof",    image:"images/roofing_services.webp",      desc:"Premium roofing solutions for any home",    path:"/get-quotes?service=roof" },
  solar:   { name:"Solar Energy",   key:"solar",   image:"images/Solar.webp",                 desc:"Save on energy costs with clean solar power",path:"/get-quotes?service=solar" },
  windows: { name:"Windows",        key:"windows", image:"images/window_services.webp",       desc:"Modern windows that improve comfort",       path:"/get-quotes?service=windows" },
  gutter:  { name:"Gutters",        key:"gutter",  image:"images/gutter_services.webp",       desc:"Quality gutter systems to protect your home",path:"/get-quotes?service=gutter" },
  bath:    { name:"Bath Remodeling", key:"bath",    image:"images/walkin_tub_services.png",    desc:"Modern bathroom renovations for comfort",   path:"/get-quotes?service=bath" },
  shower:  { name:"Walk-in Shower", key:"shower",  image:"images/walkin_shower_services.png", desc:"Modern, accessible shower solutions",       path:"/get-quotes?service=shower" },
};

function buildUpsellCards() {
  var container = document.getElementById("upsellCards");
  if (!container) return;
  container.innerHTML = "";
  var currentSvc = store.formData.service || "roof";
  var keys = Object.keys(upsellServiceData).filter(function(k) { return k !== currentSvc; }).slice(0, 5);

  keys.forEach(function(id) {
    var svc = upsellServiceData[id];
    var card = document.createElement("div");
    card.className = "group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 flex flex-col";
    card.onclick = function() { switchToService(svc.key, svc.path); };
    card.innerHTML =
      '<div class="relative overflow-hidden">' +
        '<img src="'+svc.image+'" alt="'+svc.name+'" class="w-full h-32 sm:h-36 object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>' +
      '</div>' +
      '<div class="p-3 flex flex-col flex-1">' +
        '<h4 class="font-semibold text-sm text-gray-800 mb-0.5">'+svc.name+'</h4>' +
        '<p class="text-gray-400 text-[11px] leading-snug hidden sm:block flex-1">'+svc.desc+'</p>' +
        '<button class="flex items-center justify-center gap-1 bg-orange-400 hover:bg-orange-500 text-white w-full font-semibold py-2 rounded-lg text-xs transition-colors mt-3" onclick="event.stopPropagation();switchToService(\''+svc.key+'\',\''+svc.path+'\')">' +
          'Get Quote <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>' +
        '</button>' +
      '</div>';
    container.appendChild(card);
  });
}

function switchToService(serviceKey, path) {
  // Keep personal data, switch service
  var kept = {
    email: store.formData.email, firstName: store.formData.firstName, lastName: store.formData.lastName,
    phone: store.formData.phone, address: store.formData.address, city: store.formData.city,
    state: store.formData.state, zipcode: store.formData.zipcode, isOwner: store.formData.isOwner,
  };
  store.resetAll();
  Object.keys(kept).forEach(function(k) { if (kept[k]) store.updateFormData(k, kept[k]); });
  store.updateFormData("service", serviceKey);
  store.setStep(1);
  window.location.href = path;
}

/* ═══ PAGE TRACKING (fires on every step change like PageTracker.jsx) ═══ */
var _lastTrackedStep = null;
function firePageTracking() {
  var stepName = store.getCurrentStepName() || "service-selection";
  var service = store.formData.service || "";
  var fullPath = "/get-quotes" + (service ? "/" + service : "") + "/" + stepName;

  if (_lastTrackedStep === fullPath) return;
  _lastTrackedStep = fullPath;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "virtualPageview",
    virtualPageURL: fullPath,
    virtualPageTitle: document.title,
    service: service,
  });
  if (typeof window.fbq === "function") window.fbq("track", "PageView");
  if (typeof window.snaptr === "function") window.snaptr("track", "PAGE_VIEW");
}
// Hook into renderCurrentStep
var _origRender = renderCurrentStep;
renderCurrentStep = function() { _origRender(); firePageTracking(); };

/* ═══ LEAVE CONFIRMATION DIALOG ═══ */
function showLeaveDialog() {
  var overlay = document.getElementById("leaveDialog");
  if (overlay) overlay.style.display = "flex";
}
function hideLeaveDialog() {
  var overlay = document.getElementById("leaveDialog");
  if (overlay) overlay.style.display = "none";
}
function handleSaveAndLeave() {
  hideLeaveDialog();
  window.location.href = "/";
}
function handleLeaveWithoutSaving() {
  store.resetAll();
  hideLeaveDialog();
  window.location.href = "/";
}
// Warn on browser back / close if wizard is in progress
window.addEventListener("beforeunload", function(e) {
  if (store.state.isFormStarted && !store.state.isFormCompleted && store.formData.service) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ═══ IMAGE PRELOADING (mirrors preload-images.js) ═══ */
(function() {
  var critical = [
    "images/landing/quickhomefix_Logo.png",
    "images/landing/quickhomefix_Logo2.png",
    "images/roof.png","images/solar-panel.png","images/window.png",
    "images/bath-tub.png","images/round.png","images/buket.png","images/showerr.png",
    "images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png",
    "images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png",
    "images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png",
    "images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png",
  ];
  critical.forEach(function(s) { var i = new Image(); i.src = s; });
  setTimeout(function() {
    var secondary = [
      "images/roofing_services.webp","images/Solar.webp","images/window_services.webp",
      "images/gutter_services.webp","images/walkin_tub_services.png","images/walkin_shower_services.png",
      "images/landing/roof-1.jpg","images/landing/roof-2.jpg","images/landing/roof-3.jpg",
      "images/landing/solar-1.jpg","images/landing/solar-2.jpg","images/landing/solar-3.jpg",
      "images/landing/window-1.jpg","images/landing/window-2.jpg","images/landing/window-3.jpg",
      "images/landing/bath-1.jpg","images/landing/bath-2.jpg","images/landing/bath-3.jpg",
      "images/landing/tub-1.jpg","images/landing/tub-2.jpg","images/landing/tub-3.jpg",
      "images/landing/gutter-1.jpg","images/landing/gutter-2.jpg","images/landing/gutter-3.jpg",
    ];
    secondary.forEach(function(s) { var i = new Image(); i.src = s; });
  }, 1500);
})();

