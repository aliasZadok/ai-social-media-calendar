'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowLeft, RotateCcw, FileDown, FileText, Table } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from '@/lib/store'
import exportAsCSV from '@/lib/csv-export'
import { exportAsPDF } from '@/lib/pdf-export';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type SocialMediaPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin';

const socialMediaIcons: Record<SocialMediaPlatform, JSX.Element> = {
    instagram: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
    facebook: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
    twitter: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
    </svg>
  ),
    linkedin: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
}

interface ContentIdea {
  date: string;
  platform: string;
  pillar: string;
  contentType: string;
  summary: string;
  question: string;
  contentIdea: string;
}

const getIcon = (platform: string): JSX.Element | null => {
  const lowercasePlatform = platform.toLowerCase();
  return socialMediaIcons[lowercasePlatform as keyof typeof socialMediaIcons] || null;
};

export default function CalendarPage() {
  const router = useRouter()
  const { formData, calendarData, clearCalendarData, clearFormData } = useAppStore() 
  const [currentDate, setCurrentDate] = useState(new Date(formData.startDate))
  const [selectedContent, setSelectedContent] = useState<ContentIdea | null>(null)

  const startDate = new Date(formData.startDate)
  const endDate = new Date(formData.endDate)

  // Redirect to home if calendar data is not available
  useEffect(() => {
    if (!calendarData) {
      router.push('/')
    }
  }, [calendarData, router])

  // Navigation handlers
  const handleGoBack = () => {
    router.push('/')
  }

  const handleStartOver = () => {
    clearCalendarData()
    clearFormData()
    router.push('/')
  }

  // Change the current month, respecting the selected date range
  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1)
    
    // Check if the new month has any days within the selected range
    const lastDayOfNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
    
    if (
      (increment < 0 && lastDayOfNewMonth >= startDate) || // For previous month
      (increment > 0 && newDate <= endDate) // For next month
    ) {
      setCurrentDate(newDate)
    }
  }

  // Helper functions for calendar rendering
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // Export functions (to be implemented)
const handleExportAsPDF = () => {
  if (calendarData) {
    // Ensure the platforms and distributionPattern data are included in calendarData
    const calendarDataWithPlatformsAndPattern = {
      ...calendarData,
      platforms: formData.platforms,  // Add platforms from formData
      distributionPattern: formData.distributionPattern,  // Add distribution pattern from formData
    };

    console.log("Export as PDF clicked");
    console.log("Start Date:", startDate, "End Date:", endDate);
    console.log("Calendar Data:", calendarDataWithPlatformsAndPattern);

    exportAsPDF(calendarDataWithPlatformsAndPattern, startDate);
  } else {
    console.log("No calendar data available to export");
  }
};

  const handleExportAsCSV = () => {
    if (calendarData) {
      exportAsCSV(calendarData)
    }
  }

  // Get color for content pillar
  const getPillarColor = (pillarName: string) => {
    const colors = ['bg-[hsl(var(--chart-1))]', 'bg-[hsl(var(--chart-2))]', 'bg-[hsl(var(--chart-3))]', 'bg-[hsl(var(--chart-4))]', 'bg-[hsl(var(--chart-5))]']
    const index = calendarData?.contentPillars.indexOf(pillarName) || 0
    return colors[index % colors.length]
  }

  // Render the calendar grid
  const renderCalendar = () => {
    if (!calendarData) return null;

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = getFirstDayOfMonth(currentDate)
    const calendarDays = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-40 border border-gray-200 bg-gray-100"></div>)
    }

    // Render each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });

      const isWithinRange = isWithinSelectedRange(date);
      const isPostingDay = formData.distributionPattern.includes(dayOfWeek);

      const dayContent = calendarData.contentIdeas.filter(
        (content) => {
          const contentDate = new Date(content.date);
          return contentDate.getFullYear() === date.getFullYear() &&
                 contentDate.getMonth() === date.getMonth() &&
                 contentDate.getDate() === date.getDate();
        }
      )

      calendarDays.push(
        <div 
          key={day} 
          className={`h-40 border border-gray-200 p-1 overflow-y-auto
            ${isWithinRange ? (isPostingDay ? 'bg-blue-50' : '') : 'bg-gray-100'}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isWithinRange ? '' : 'text-gray-400'}`}>{day}</div>
          {isWithinRange && (
            <div className="space-y-1">
              {dayContent.map((content, index) => (
                <div
                  key={index}
                  className={`${getPillarColor(content.pillar)} p-2 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer text-xs`}
                  onClick={() => setSelectedContent(content)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {getIcon(content.platform)}
                    </div>
                    <div className="flex-grow truncate">
                      {capitalizeFirstLetter(content.platform)}: {content.summary}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return calendarDays
  }

  const isWithinSelectedRange = (date: Date) => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    // Set the time to midnight for consistent comparison
    date.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return date >= startDate && date <= endDate;
  }


  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header with navigation buttons */}
      <header className="flex items-center justify-between mb-4">
        <Button onClick={handleGoBack} variant="default">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <h1 className="text-2xl font-bold">Social Media Content Calendar</h1>
        <Button onClick={handleStartOver} variant="default">
          <RotateCcw className="mr-2 h-4 w-4" /> Start Over
        </Button>
      </header>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          onClick={() => changeMonth(-1)} 
          variant="default" 
          disabled={new Date(currentDate.getFullYear(), currentDate.getMonth(), 0) < startDate}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <Button 
          onClick={() => changeMonth(1)} 
          variant="default" 
          disabled={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > endDate}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of the week header */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>

      {calendarData && (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Content Pillars</h3>
        <div className="flex flex-wrap gap-2">
          {calendarData.contentPillars.map((pillar) => (
            <div key={pillar} className={`${getPillarColor(pillar)} px-3 py-1 rounded`}>
              {pillar}  
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Export dropdown */}
      <div className="fixed bottom-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <FileDown className="mr-2 h-4 w-4" /> Export Calendar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportAsPDF}>
              <FileText className="mr-2 h-4 w-4" /> Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportAsCSV}>
              <Table className="mr-2 h-4 w-4" /> Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content details dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="bg-background">
        <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedContent && getIcon(selectedContent.platform)}
              <span>{selectedContent && capitalizeFirstLetter(selectedContent.platform)} Post</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <DialogDescription>
              <span className="font-semibold">Summary:</span> {selectedContent?.summary}
            </DialogDescription>
            <div>
              <span className="font-semibold">Content Type:</span> {selectedContent?.contentType}
            </div>
            <div>
              <span className="font-semibold">Pillar:</span> {selectedContent?.pillar}
            </div>
            <div>
              <span className="font-semibold">Question:</span> {selectedContent?.question}
            </div>
            <div>
              <span className="font-semibold">Content Idea:</span> {selectedContent?.contentIdea}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}