import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getServiceFlow } from "@/lib/service-flows"; // Proper import instead of mock

/**
 * Initial form data with default values
 */
const initialFormData = {
  service: "",
  email: "",
  roofingType: "",
  roofCount: "",
  material: "",
  windowType: "",
  windowCount: "",
  windowStyle: "",
  solarType: "",
  roofSize: "",
  energyBill: "",
  address: "",
  city: "",
  state: "California",
  zipcode: "",
  isOwner: null,
  canMakeChanges: null,
  firstName: "",
  lastName: "",
  phone: "",
};

/**
 * Zustand store for managing form state
 * Uses persist middleware to save state in localStorage
 */
const useFormStore = create(
  persist(
    (set, get) => ({
      formData: initialFormData,
      currentStep: 0,
      
      /**
       * Updates a specific field in the form data
       * @param {string} field - The field to update
       * @param {any} value - The new value
       */
      updateFormData: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),
      
      /**
       * Advances to the next step in the form flow
       * Limited by the maximum steps in the current service flow
       */
      nextStep: () =>
        set((state) => {
          const serviceFlow = getServiceFlow(state.formData.service);
          
          // Safety check
          if (!state.formData.service) {
            console.warn("No service selected, defaulting to first service");
            // If no service selected, don't advance
            return state;
          }
          
          const maxSteps = serviceFlow.totalSteps;
          const nextStepValue = Math.min(state.currentStep + 1, maxSteps);
          
          console.log(`Moving from step ${state.currentStep} to ${nextStepValue}`);
          
          return {
            currentStep: nextStepValue,
          };
        }),
      
      /**
       * Returns to the previous step in the form flow
       * Cannot go below step 0
       */
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      
      /**
       * Resets the form to its initial state
       * Also clears localStorage to ensure a fresh start
       */
      resetForm: () => {
        // Clear localStorage completely for this store
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roofing-form-storage');
        }
        
        set({
          formData: initialFormData,
          currentStep: 0,
        });
      },
        
      /**
       * Set the current step directly (useful for navigation or debugging)
       * @param {number} step - The step to set
       */
      setStep: (step) =>
        set({
          currentStep: step,
        }),
    }),
    {
      name: "roofing-form-storage", // Name for localStorage key
    }
  )
);

export { useFormStore, initialFormData };
