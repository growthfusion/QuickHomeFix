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
  bathshowerType:"",
  bathwallType:"",
  gutterMaterial:"",
  sunExposure:"",
  gutterType:"",
  walkinType:"",
  address: "",
  city: "",
  state: "",
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
      isFormStarted: false,
      isFormCompleted: false,
      homePageState: {},
      showLeaveDialog: false, // New state for leave dialog

      updateFormData: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
          isFormStarted: field === 'service' && value ? true : state.isFormStarted,
        })),

      nextStep: () =>
        set((state) => {
          const serviceFlow = getServiceFlow(state.formData.service);
          if (!state.formData.service) return state;
          
          const maxSteps = serviceFlow.totalSteps;
          const nextStepValue = Math.min(state.currentStep + 1, maxSteps);
          const isCompleted = nextStepValue >= maxSteps;
          
          return { 
            currentStep: nextStepValue,
            isFormStarted: true,
            isFormCompleted: isCompleted
          };
        }),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
          isFormCompleted: false,
        })),

      setStep: (step) => 
        set((state) => {
          const serviceFlow = getServiceFlow(state.formData.service);
          if (!state.formData.service) return { currentStep: step };
          
          const maxSteps = serviceFlow.totalSteps;
          const isCompleted = step >= maxSteps;
          
          return {
            currentStep: step,
            isFormCompleted: isCompleted
          };
        }),

      // Leave confirmation methods
      showLeaveConfirmation: () => set({ showLeaveDialog: true }),
      
      hideLeaveConfirmation: () => set({ showLeaveDialog: false }),

      // Check if user has unsaved changes
      hasUnsavedChanges: () => {
        const state = get();
        return state.isFormStarted && !state.isFormCompleted && state.formData.service;
      },

      // Handle home navigation with confirmation
      handleHomeNavigation: (navigateCallback) => {
        const state = get();
        
        console.log('=== Home Navigation Debug ===');
        console.log('isFormStarted:', state.isFormStarted);
        console.log('isFormCompleted:', state.isFormCompleted);
        console.log('service:', state.formData.service);
        console.log('hasUnsavedChanges:', state.hasUnsavedChanges());
        
        // If no unsaved changes, navigate directly
        if (!state.hasUnsavedChanges()) {
          console.log('No unsaved changes - navigating directly');
          navigateCallback();
          return;
        }
        
        // Show confirmation dialog
        console.log('Showing leave confirmation dialog');
        set({ showLeaveDialog: true });
      },

      // Save current progress and keep data for later
      saveProgress: () => {
        const state = get();
        console.log('Saving progress...', state.formData);
        
        // Mark progress as saved (but not completed)
        set({ 
          isFormCompleted: false, // Keep as false so user can continue later
          isFormStarted: true     // Keep as true to maintain progress
        });
        
        // You can add additional save logic here like:
        // - Send to backend
        // - Save to localStorage with timestamp
        // - Send analytics event
        
        console.log('Progress saved successfully');
        return true;
      },

      // Save and leave - preserves progress
      saveAndLeave: (navigateCallback) => {
        console.log('User chose Save & Leave');
        
        // Save the current progress
        const saved = get().saveProgress();
        
        if (saved) {
          // Don't reset the form - keep the data for later
          set({ showLeaveDialog: false });
          
          // Navigate to home but keep the progress
          if (navigateCallback) navigateCallback();
          
          console.log('Saved and navigated - user can continue later');
        }
      },

      // Leave without saving - resets everything
      confirmLeave: (navigateCallback) => {
        console.log('User confirmed leave without saving - resetting and navigating');
        get().resetAll();
        set({ showLeaveDialog: false });
        if (navigateCallback) navigateCallback();
      },

      // Cancel leave
      cancelLeave: () => {
        console.log('User cancelled leave');
        set({ showLeaveDialog: false });
      },

      completeForm: () =>
        set({
          isFormCompleted: true,
        }),

      resetForm: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("roofing-form-storage");
        }
        set({ 
          formData: initialFormData, 
          currentStep: 0,
          isFormStarted: false,
          isFormCompleted: false,
          showLeaveDialog: false,
        });
      },

      resetHomePageState: () =>
        set({
          homePageState: {},
        }),

      resetAll: () => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("roofing-form-storage");
        }
        set({
          formData: initialFormData,
          currentStep: 0,
          homePageState: {},
          isFormStarted: false,
          isFormCompleted: false,
          showLeaveDialog: false,
        });
      },

      initForm: () => {
        const state = get();
        if (typeof window !== "undefined") {
          if (state.isFormCompleted) {
            get().resetAll();
            return;
          }
          
          if (window.location.pathname === "/" && !state.isFormStarted) {
            get().resetAll();
          }
        }
      },

      isCompleted: () => {
        const state = get();
        return state.isFormCompleted;
      },

      canContinueFlow: () => {
        const state = get();
        return state.isFormStarted && state.formData.service && !state.isFormCompleted;
      },

      getProgress: () => {
        const state = get();
        if (!state.formData.service) return { current: 0, total: 0 };
        
        const serviceFlow = getServiceFlow(state.formData.service);
        return {
          current: state.currentStep,
          total: serviceFlow.totalSteps,
          service: state.formData.service,
          isCompleted: state.isFormCompleted
        };
      },

      handleFormSubmission: async (submitCallback) => {
        try {
          if (submitCallback) {
            await submitCallback(get().formData);
          }
          
          set({ isFormCompleted: true });
          
          setTimeout(() => {
            get().resetAll();
          }, 2000);
          
        } catch (error) {
          console.error('Form submission failed:', error);
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
