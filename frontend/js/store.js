/* ─── QuickHomeFix – State Management (sessionStorage) ─── */

const initialFormData = {
  service: "", email: "", roofingType: "", roofCount: "", material: "",
  windowType: "", windowCount: "", windowStyle: "", solarType: "",
  electricBill: "", roofSize: "", bathshowerType: "", bathwallType: "",
  gutterMaterial: "", sunExposure: "", gutterType: "", walkinType: "",
  bathNeeds: "", tubReason: "", address: "", city: "", state: "",
  zipcode: "", isOwner: null, canMakeChanges: null, firstName: "",
  lastName: "", phone: "", trustedFormToken: "", homePhoneConsentLanguage: "",
};

const STORAGE_KEY = "roofing-form-storage";

/* ─── Service Flows ─── */
const serviceFlows = {
  roof:    { id: "roof",    name: "Roofing Service", initialStep: "zipcode", steps: ["zipcode","roofing-type","material","email","details","name","final","complete"] },
  windows: { id: "windows", name: "Windows Service",  initialStep: "zipcode", steps: ["zipcode","window-type","window-count","email","details","name","final","complete"] },
  solar:   { id: "solar",   name: "Solar Energy",     initialStep: "zipcode", steps: ["zipcode","solar-type","roof-size","email","details","name","final","complete"] },
  bath:    { id: "bath",    name: "Bath Remodeling",   initialStep: "zipcode", steps: ["zipcode","bathroom-wall","email","details","name","final","complete"] },
  gutter:  { id: "gutter",  name: "Gutter Services",   initialStep: "zipcode", steps: ["zipcode","gutter-type","gutter-material","email","details","name","final","complete"] },
  tub:     { id: "tub",     name: "Walk-In Tub",       initialStep: "zipcode", steps: ["zipcode","tub-reason","email","details","name","final","complete"] },
  shower:  { id: "shower",  name: "Walk-In Shower",    initialStep: "zipcode", steps: ["zipcode","walk","email","details","name","final","complete"] },
};

function getServiceFlow(serviceId) {
  if (!serviceId || !serviceId.trim()) return serviceFlows.roof;
  return serviceFlows[serviceId] || serviceFlows.roof;
}

function isValidService(serviceId) {
  return serviceId && serviceId in serviceFlows;
}

/* ─── Store ─── */
function loadStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { formData: { ...initialFormData }, currentStep: 0, isFormStarted: false, isFormCompleted: false };
}

function saveStore(state) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

let _state = loadStore();

const store = {
  get state() { return _state; },
  get formData() { return _state.formData; },
  get currentStep() { return _state.currentStep; },

  updateFormData(field, value) {
    _state.formData[field] = value;
    if (field === "service" && value) _state.isFormStarted = true;
    saveStore(_state);
  },

  nextStep() {
    const flow = getServiceFlow(_state.formData.service);
    if (!_state.formData.service) return;
    const max = flow.steps.length;
    _state.currentStep = Math.min(_state.currentStep + 1, max);
    _state.isFormStarted = true;
    _state.isFormCompleted = _state.currentStep >= max;
    saveStore(_state);
  },

  prevStep() {
    _state.currentStep = Math.max(_state.currentStep - 1, 0);
    _state.isFormCompleted = false;
    saveStore(_state);
  },

  setStep(step) {
    _state.currentStep = step;
    saveStore(_state);
  },

  resetAll() {
    sessionStorage.removeItem(STORAGE_KEY);
    _state = { formData: { ...initialFormData }, currentStep: 0, isFormStarted: false, isFormCompleted: false };
    saveStore(_state);
  },

  getCurrentStepName() {
    const flow = getServiceFlow(_state.formData.service);
    const idx = _state.currentStep - 1;
    if (idx < 0 || idx >= flow.steps.length) return null;
    return flow.steps[idx];
  },

  getProgress() {
    if (!_state.formData.service) return 0;
    var flow = getServiceFlow(_state.formData.service);
    var totalVisible = flow.steps.length - 1;
    var stepNum = _state.currentStep;
    var stepName = this.getCurrentStepName();
    if (stepName === "final") return 95;
    return Math.min(Math.round((stepNum / totalVisible) * 100), 100);
  },

  /** Switch service — reset service-specific fields, keep personal data, skip completed steps */
  switchService(newService) {
    var fd = _state.formData;
    // Keep only personal data
    var kept = {
      email: fd.email, firstName: fd.firstName, lastName: fd.lastName,
      phone: fd.phone, address: fd.address, city: fd.city,
      state: fd.state, zipcode: fd.zipcode, isOwner: fd.isOwner,
    };
    // Reset to initial then overlay personal data + new service
    var newFormData = {};
    for (var k in initialFormData) newFormData[k] = initialFormData[k];
    newFormData.service = newService;
    for (var p in kept) { if (kept[p]) newFormData[p] = kept[p]; }

    // Figure out which steps can be skipped
    var flow = getServiceFlow(newService);
    var canSkip = function(stepName) {
      switch (stepName) {
        case "zipcode": return !!(kept.zipcode && kept.zipcode.length >= 5);
        case "email": return !!(kept.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kept.email));
        case "name": return !!(kept.firstName && kept.lastName);
        case "details": return !!(kept.address && kept.city && kept.state && kept.zipcode);
        default: return false;
      }
    };

    var startStep = 1;
    if (flow) {
      for (var i = 0; i < flow.steps.length; i++) {
        if (canSkip(flow.steps[i])) {
          startStep = i + 2;
        } else {
          startStep = i + 1;
          break;
        }
      }
    }

    _state = {
      formData: newFormData,
      currentStep: startStep,
      isFormStarted: true,
      isFormCompleted: false,
    };
    saveStore(_state);
  },
};
