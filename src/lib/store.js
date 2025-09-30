// stores/formStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getServiceFlow } from "@/lib/service-flows";

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
    if (typeof window === "undefined") return null;
    const value = sessionStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name, value) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(name, JSON.stringify(value));
    }
  },
  removeItem: (name) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(name);
    }
  },
};

const useFormStore = create(
  persist(
    (set, get) => ({
      formData: initialFormData,
      currentStep: 0,
      // Add any other state you have on home page
      homePageState: {},

      updateFormData: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
        })),

      nextStep: () =>
        set((state) => {
          const serviceFlow = getServiceFlow(state.formData.service);
          if (!state.formData.service) return state;
          const maxSteps = serviceFlow.totalSteps;
          const nextStepValue = Math.min(state.currentStep + 1, maxSteps);
          return { currentStep: nextStepValue };
        }),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      setStep: (step) => set({ currentStep: step }),

      resetForm: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("roofing-form-storage");
        }
        set({ formData: initialFormData, currentStep: 0 });
      },

      resetHomePageState: () =>
        set({
          homePageState: {},
        }),

      // Full reset for home page
      resetAll: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("roofing-form-storage");
        }
        set({
          formData: initialFormData,
          currentStep: 0,
          homePageState: {},
        });
      },

      initForm: () => {
        if (typeof window !== "undefined" && window.location.pathname === "/") {
          get().resetAll();
        }
      },
    }),
    {
      name: "roofing-form-storage",
      storage: sessionStorageAdapter,
    }
  )
);

export { useFormStore, initialFormData };
