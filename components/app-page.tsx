'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import FrequencySlider from '@/components/ui/frequency-slider'

export function LandingPage() {
  const router = useRouter()
  const { formData, calendarData, setFormData, setCalendarData, clearFormData } = useAppStore()
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const form = new FormData()
    form.append('description', formData.description)
    form.append('platforms', JSON.stringify(formData.platforms))
    form.append('startDate', formData.startDate)
    form.append('endDate', formData.endDate)
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
        const truncatedText = data.text.substring(0, 500); // Truncate to 500 characters
        setFormData({ description: truncatedText });
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
              value={formData.description}
              onChange={(e) => setFormData({ description: e.target.value })}
              maxLength={500}
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
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred social media platforms</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.platforms).map(([platform, checked], index) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setFormData({
                        platforms: { ...formData.platforms, [platform]: checked as boolean },
                      })
                    }
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
                value={formData.startDate}
                onChange={(e) => setFormData({ startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">End date</label>
              <Input
                id="end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ endDate: e.target.value })}
              />
            </div>
          </div>

          <FrequencySlider
            value={formData.frequency}
            onChange={(value) => setFormData({ ...formData, frequency: value })}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
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