/**
 * Central configuration for all service flows.
 * This is the SINGLE SOURCE OF TRUTH for service definitions.
 *
 * FLOW ORDER: zipcode → service-specific steps → email → name → phone → dfaddress → complete
 *
 * To add a new service:
 *   1. Add an entry here with id, name, initialStep, and steps.
 *   2. Create the step components referenced in `steps`.
 *   3. Register them in the stepComponents map inside QuoteWizard.
 *   That's it — routing and navigation are handled automatically.
 */
const serviceFlows = {
  roof: {
    id: "roof",
    name: "Roofing Service",
    initialStep: "zipcode",
    steps: ["zipcode", "roofing-type", "material", "details", "final", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  windows: {
    id: "windows",
    name: "Windows Service",
    initialStep: "zipcode",
    steps: ["zipcode", "window-type", "window-count", "details", "final", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  solar: {
    id: "solar",
    name: "Solar Energy",
    initialStep: "zipcode",
    steps: ["zipcode", "solar-type", "roof-size", "email", "name", "phone", "dfaddress", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  bath: {
    id: "bath",
    name: "Bath Remodeling",
    initialStep: "zipcode",
    steps: ["zipcode", "bath-needs", "details", "final", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  gutter: {
    id: "gutter",
    name: "Gutter Services",
    initialStep: "zipcode",
    steps: ["zipcode", "gutter-type", "gutter-material", "email", "name", "phone", "dfaddress", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  tub: {
    id: "tub",
    name: "Walk-In Tub",
    initialStep: "zipcode",
    steps: ["zipcode", "tub-reason", "details", "final", "complete"],
    get totalSteps() { return this.steps.length; },
  },
  shower: {
    id: "shower",
    name: "Walk-In Shower",
    initialStep: "zipcode",
    steps: ["zipcode", "walk", "email", "name", "phone", "dfaddress", "complete"],
    get totalSteps() { return this.steps.length; },
  },
};

/** All valid service IDs (useful for route validation) */
const validServiceIds = Object.keys(serviceFlows);

/**
 * Get the service flow configuration for a given service ID.
 * @param {string} serviceId
 * @returns {ServiceFlow} Defaults to roof if not found.
 */
function getServiceFlow(serviceId) {
  if (!serviceId || serviceId.trim() === "") {
    return serviceFlows.roof;
  }
  return serviceFlows[serviceId] || serviceFlows.roof;
}

/**
 * Check if a service ID is valid / registered.
 * @param {string} serviceId
 * @returns {boolean}
 */
function isValidService(serviceId) {
  return serviceId && serviceId in serviceFlows;
}

/**
 * Get the index of a specific step within a service flow.
 * @param {string} serviceId
 * @param {string} stepName
 * @returns {number} -1 if not found.
 */
function getStepIndex(serviceId, stepName) {
  const flow = getServiceFlow(serviceId);
  return flow.steps.indexOf(stepName);
}

/**
 * Check if a step is the final step in a service flow.
 * @param {string} serviceId
 * @param {string} stepName
 * @returns {boolean}
 */
function isLastStep(serviceId, stepName) {
  const flow = getServiceFlow(serviceId);
  return stepName === flow.steps[flow.totalSteps - 1];
}

export { serviceFlows, validServiceIds, getServiceFlow, isValidService, getStepIndex, isLastStep };
