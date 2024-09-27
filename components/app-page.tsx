'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import FrequencySelector from '@/components/ui/frequency-selector'

type Platforms = {
  instagram: boolean;
  facebook: boolean;
  twitter: boolean;
  linkedin: boolean;
};

export function LandingPage() {
  const router = useRouter()
  const { formData, calendarData, setFormData, setCalendarData, clearCalendarData } = useAppStore()
  const [localFormData, setLocalFormData] = useState({
    ...formData,
    frequency: formData.frequency || 3,
    distributionPattern: formData.distributionPattern || ['Monday', 'Wednesday', 'Friday']
  })
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasFormChanged, setHasFormChanged] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [dateRangeInDays, setDateRangeInDays] = useState(0)

  useEffect(() => {
    setLocalFormData({
      ...formData,
      frequency: formData.frequency || 3,
      distributionPattern: formData.distributionPattern || ['Monday', 'Wednesday', 'Friday']
    })
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (hasFormChanged) {
      clearCalendarData()
      setFormData(localFormData)
    }

    const form = new FormData()
    form.append('description', localFormData.description)
    form.append('platforms', JSON.stringify(localFormData.platforms))
    form.append('startDate', localFormData.startDate)
    form.append('endDate', localFormData.endDate)
    form.append('frequency', localFormData.frequency.toString())
    form.append('distributionPattern', JSON.stringify(localFormData.distributionPattern))

    if (file) {
      form.append('file', file)
    }

    try {
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        throw new Error('Failed to generate calendar')
      }

      const data = await response.json()

      setCalendarData(data)
      setHasFormChanged(false)
      router.push('/calendar')
    } catch (error) {
      console.error('Error generating calendar:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file)
    setUploadError(null)
    setIsUploading(true)

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-file-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      if (data.text) {
        const truncatedText = data.text.substring(0, 2000);
        handleFormChange({ description: truncatedText });
      } else {
        throw new Error('No text content in the response');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload and process file. Please try again.');
    } finally {
      setIsUploading(false)
    }
  };

  const handleGoToCalendar = () => {
    if (calendarData) {
      router.push('/calendar')
    }
  }

  const handleFormChange = (changes: Partial<typeof localFormData>) => {
    const newFormData = { ...localFormData, ...changes }
    setLocalFormData(newFormData)
    setHasFormChanged(true)
    if ('startDate' in changes || 'endDate' in changes) {
      validateDateRange(newFormData.startDate, newFormData.endDate)
    }
  }

  const validateDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check if end date is before start date
    if (end < start) {
      setDateError('The end date must be after the start date.')
      setDateRangeInDays(0)
      return
    }

    // Calculate the difference in days
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    setDateRangeInDays(diffDays)

    if (diffDays > 90) {
      setDateError('The date range cannot exceed 90 days.')
    } else {
      setDateError(null)
    }

    // Adjust platform selection for ranges of 60 days or more
    if (diffDays >= 60) {
      const selectedPlatforms = Object.entries(localFormData.platforms).filter(([, isSelected]) => isSelected)
      if (selectedPlatforms.length > 1) {
        const [firstSelectedPlatform] = selectedPlatforms[0]
        setLocalFormData(prevData => ({
          ...prevData,
          platforms: Object.fromEntries(
            Object.entries(prevData.platforms).map(([platform]) => 
              [platform, platform === firstSelectedPlatform]
            )
          ) as Platforms
        }))
      }
    }
  }

  const handlePlatformChange = (platform: keyof Platforms, checked: boolean) => {
    if (dateRangeInDays >= 60) {
      // For 60+ days range, only allow changing if no platform is currently selected
      const currentlySelected = Object.values(localFormData.platforms).some(v => v)
      if (currentlySelected && !localFormData.platforms[platform]) {
        // If a platform is already selected and user is trying to select a different one, ignore the change
        return
      }
    }

    // For less than 60 days range or when no platform is selected in 60+ days range, allow the change
    setLocalFormData(prevData => ({
      ...prevData,
      platforms: {
        ...prevData.platforms,
        [platform]: checked
      }
    }))
  }

  const isPlatformDisabled = (platform: keyof Platforms) => {
    if (dateRangeInDays >= 60) {
      // For 60+ days range, disable all platforms except the selected one
      const selectedPlatform = Object.entries(localFormData.platforms).find(([, isSelected]) => isSelected)
      return selectedPlatform ? selectedPlatform[0] !== platform : false
    }
    return false
  }


  const isSubmitDisabled = !!dateError || isLoading || Object.values(localFormData.platforms).every(v => !v)

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-3xl font-bold">Social Media Calendar</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Describe your business and target audience
            </label>
            <Textarea
              id="description"
              placeholder="e.g., We sell handmade jewellery to women aged 25-45 interested in fashion and sustainability."
              value={localFormData.description}
              onChange={(e) => handleFormChange({ description: e.target.value })}
              maxLength={2000}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept=".pdf,.txt"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" /> 
              {isUploading ? 'Uploading...' : 'Upload PDF/TXT'}
            </Button>
          </div>
          {uploadError && <p className="error-message">{uploadError}</p>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred social media platforms</label>
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(localFormData.platforms) as Array<keyof Platforms>).map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={localFormData.platforms[platform]}
                    onCheckedChange={(checked) => handlePlatformChange(platform, checked as boolean)}
                    disabled={isPlatformDisabled(platform)}
                  />
                  <label htmlFor={platform} className="capitalize">{platform}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">Start date</label>
              <Input
                id="start-date"
                type="date"
                value={localFormData.startDate}
                onChange={(e) => handleFormChange({ startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">End date</label>
              <Input
                id="end-date"
                type="date"
                value={localFormData.endDate}
                onChange={(e) => handleFormChange({ endDate: e.target.value })}
              />
            </div>
          </div>
          {dateError && <p className="error-message">{dateError}</p>}

          <FrequencySelector
            value={localFormData.frequency}
            onChange={(frequency, distributionPattern) => handleFormChange({ frequency, distributionPattern })}
            maxFrequency={dateRangeInDays >= 60 ? 3 : 7}
          />

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {isLoading ? 'Generating...' : 'Generate My Calendar'}
          </Button>
        </form>
        {calendarData && (
          <Button onClick={handleGoToCalendar} className="w-full mt-4">
            Go to Calendar
          </Button>
        )}
      </div>
    </main>
  )
}