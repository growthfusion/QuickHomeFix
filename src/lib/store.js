import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getServiceFlow } from "@/lib/service-flows";

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


const sessionStorageAdapter = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const value = sessionStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(name);
    }
  },
};


const useFormStore = create(
  persist(
    (set, get) => ({
      formData: initialFormData,
      currentStep: 0,
      
      
      updateFormData: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),
      
     
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
      
      
      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      
      resetForm: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('roofing-form-storage');
        }
        
        set({
          formData: initialFormData,
          currentStep: 0,
        });
      },
        
     
      setStep: (step) =>
        set({
          currentStep: step,
        }),
    }),
    {
      name: "roofing-form-storage", // Name for sessionStorage key
      storage: sessionStorageAdapter, // Use our custom sessionStorage adapter
    }
  )
);

export { useFormStore, initialFormData };
