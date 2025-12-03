import { create } from 'zustand';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactStore {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  submitContact: (formData: ContactFormData) => Promise<boolean>;
  reset: () => void;
}

export const useContactStore = create<ContactStore>((set) => ({
  isSubmitting: false,
  error: null,
  success: false,

  setSubmitting: (isSubmitting: boolean) => set({ isSubmitting }),
  
  setError: (error: string | null) => set({ error }),
  
  setSuccess: (success: boolean) => set({ success }),

  submitContact: async (formData: ContactFormData) => {
    set({ isSubmitting: true, error: null, success: false });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        set({ 
          isSubmitting: false, 
          success: true, 
          error: null 
        });
        return true;
      } else {
        set({ 
          isSubmitting: false, 
          success: false, 
          error: data.message || 'Failed to send message' 
        });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send message. Please try again later.';
      set({ 
        isSubmitting: false, 
        success: false, 
        error: errorMessage 
      });
      return false;
    }
  },

  reset: () => set({ 
    isSubmitting: false, 
    error: null, 
    success: false 
  }),
}));
