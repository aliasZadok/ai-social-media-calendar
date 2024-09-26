import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type FrequencyOption = 1 | 7 | 14 | 30;

interface CalendarFormData {
    description: string
    platforms: {
        instagram: boolean
        facebook: boolean
        twitter: boolean
        linkedin: boolean
    }
    startDate: string
    endDate: string
    frequency: FrequencyOption
}

interface CalendarData {
    contentPillars: string[];
    contentIdeas: ContentIdea[]
}

interface ContentPillar {
    name: string
    keyword: string
    questions: string[]
}

interface ContentIdea {
    date: string
    platform: string
    pillar: string
    contentType: string
    summary: string
    question: string
    contentIdea: string
}

interface AppState {
    formData: CalendarFormData
    calendarData: CalendarData | null
    setFormData: (formData: Partial<CalendarFormData>) => void
    setCalendarData: (calendarData: CalendarData) => void
    clearFormData: () => void
    clearCalendarData: () => void
}

const initialFormData: CalendarFormData = {
    description: '',
    platforms: {
        instagram: false,
        facebook: false,
        twitter: false,
        linkedin: false,
    },
    startDate: '',
    endDate: '',
    frequency: 7,  // Default to weekly (7 days)
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            formData: initialFormData,
            calendarData: null,
            setFormData: (newFormData) => set((state) => ({
                formData: { ...state.formData, ...newFormData }
            })),
            setCalendarData: (calendarData) => set({ calendarData }),
            clearFormData: () => set({ formData: initialFormData }),
            clearCalendarData: () => set({ calendarData: null }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)