import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ContentIdea {
  date: string;
  platform: string;
  pillar: string;
  contentType: string;
  summary: string;
  question: string;
  contentIdea: string;
}

interface CalendarData {
  contentPillars: string[];
  contentIdeas: ContentIdea[];
}

interface FormData {
  description: string
  platforms: {
    instagram: boolean
    facebook: boolean
    twitter: boolean
    linkedin: boolean
  }
  startDate: string
  endDate: string
  frequency: number
  distributionPattern: string[]
}

interface AppState {
  formData: FormData
  calendarData: CalendarData | null
  setFormData: (data: Partial<FormData>) => void
  setCalendarData: (data: CalendarData) => void
  clearFormData: () => void
  clearCalendarData: () => void
}

const initialFormData: FormData = {
  description: '',
  platforms: {
    instagram: false,
    facebook: false,
    twitter: false,
    linkedin: false,
  },
  startDate: '',
  endDate: '',
  frequency: 3,
  distributionPattern: ['Monday', 'Wednesday', 'Friday'],
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        formData: initialFormData,
        calendarData: null,
        setFormData: (data) =>
          set((state) => ({ formData: { ...state.formData, ...data } })),
        setCalendarData: (data) => set({ calendarData: data }),
        clearFormData: () => set({ formData: initialFormData }),
        clearCalendarData: () => set({ calendarData: null }),
      }),
      {
        name: 'app-storage',
      }
    )
  )
)