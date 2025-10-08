/**
 * @typedef {Object} ServiceFlow
 * @property {string} id - Unique identifier for the service
 * @property {string} name - Display name for the service
 * @property {string[]} steps - Array of step names in sequence
 * @property {number} totalSteps - Total number of steps in the flow
 */

/**
 * Configuration for all service flows in the application
 * @type {Object.<string, ServiceFlow>}
 */
const serviceFlows = {
  roof: {
    id: "roof",
    name: "Roofing Service",
    steps: [ "roofing-type", "roof-count", "material","email",  "name", "phone","address", "complete"],
    totalSteps: 8,
  },
  windows: {
    id: "windows",
    name: "Windows Service",
    steps: [ "window-type", "window-style", "window-count", "email", "name", "phone","dfaddress", "complete"],
    totalSteps: 8,
  },
  solar: {
    id: "solar",
    name: "Solar Energy",
    steps: [ "solar-type", "roof-size", "email", "name", "phone","dfaddress", "complete"],
    totalSteps: 7,
  },
  bath: {
    id: "bath",
    name: "Bath Remodeling",
    steps: ["bathroom-wall","bathroom-shower","email", "name", "phone","dfaddress", "complete"],
    totalSteps: 7,
  },
  gutter: {
    id: "gutter",
    name: "Gutter Services",
    steps: ["gutter-type","gutter-material","email", "name", "phone","dfaddress", "complete"],
    totalSteps: 7,
  },
  "tub": {
    id: "walk-in",
    name: "Walk-in-Tub/Shower",
    steps: ["walkin-type","email",  "name", "phone","dfaddress", "complete"],
    totalSteps: 6,
  },
  "shower": {
    id: "walk-in",
    name: "Walk-in-Tub/Shower",
    steps: ["walkin-type","email",  "name", "phone","dfaddress", "complete"],
    totalSteps: 6,
  },
};

/**
 * Get the service flow configuration for a specified service ID
 * @param {string} serviceId - The ID of the service to retrieve
 * @returns {ServiceFlow} The service flow configuration (defaults to roof if not found)
 */
function getServiceFlow(serviceId) {
  if (!serviceId || serviceId.trim() === "") {
    console.warn("Empty serviceId provided to getServiceFlow");
    return serviceFlows.roof; // Default to roof
  }
  
  // Check if the service exists
  if (!serviceFlows[serviceId]) {
    console.warn(`Unknown service ID: ${serviceId}, defaulting to roof`);
  }
  
  return serviceFlows[serviceId] || serviceFlows.roof;
}

/**
 * Get the index of a specific step within a service flow
 * @param {string} serviceId - The ID of the service
 * @param {string} stepName - The name of the step to find
 * @returns {number} The index of the step in the flow (-1 if not found)
 */
function getStepIndex(serviceId, stepName) {
  const flow = getServiceFlow(serviceId);
  return flow.steps.indexOf(stepName);
}

/**
 * Check if a step is the final step in a service flow
 * @param {string} serviceId - The ID of the service
 * @param {string} stepName - The name of the step to check
 * @returns {boolean} True if the step is the last step in the flow
 */
function isLastStep(serviceId, stepName) {
  const flow = getServiceFlow(serviceId);
  return stepName === flow.steps[flow.totalSteps - 1];
}

// Use ES Modules exports
export { serviceFlows, getServiceFlow, getStepIndex, isLastStep };
