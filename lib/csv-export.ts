import { saveAs } from 'file-saver';

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

const exportAsCSV = (calendarData: CalendarData) => {
  // Define CSV headers
  const headers = [
    'Date',
    'Platform',
    'Content Pillar',
    'Content Type',
    'Summary',
    'Question',
    'Content Idea'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  // Sort content ideas by date
  const sortedIdeas = [...calendarData.contentIdeas].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Add data rows
  sortedIdeas.forEach((idea) => {
    const row = [
      idea.date,
      idea.platform,
      idea.pillar,
      idea.contentType,
      `"${idea.summary.replace(/"/g, '""')}"`,
      `"${idea.question.replace(/"/g, '""')}"`,
      `"${idea.contentIdea.replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\n';
  });

  // Create Blob and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'social_media_calendar.csv');
};

export default exportAsCSV;