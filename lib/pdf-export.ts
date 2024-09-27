import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { ContentIdea } from '@/lib/store';

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

interface CalendarData {
  contentPillars: string[];
  contentIdeas: ContentIdea[];
  platforms: {
    instagram: boolean;
    facebook: boolean;
    twitter: boolean;
    linkedin: boolean;
  };
  distributionPattern: string[];
}

export const exportAsPDF = (calendarData: CalendarData, startDate: Date) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // Add title
  doc.setFontSize(18);
  doc.text('Social Media Content Calendar', 14, 15);

  // Add date range
  const endDate = new Date(calendarData.contentIdeas[calendarData.contentIdeas.length - 1].date);
  doc.setFontSize(12);
  doc.text(`Date Range: ${startDate.toDateString()} - ${endDate.toDateString()}`, 14, 25);

  let yOffset = 35;

  // Group content ideas by week based on their actual dates
  const groupedIdeas = groupContentIdeasByWeek(calendarData.contentIdeas);

  // Iterate through weeks
  Object.entries(groupedIdeas).forEach(([weekStartDate, ideas], index) => {
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Add week header
    doc.setFontSize(14);
    doc.text(`Week ${index + 1} (${weekStart.toDateString()} - ${weekEnd.toDateString()})`, 14, yOffset);
    yOffset += 10;

    // Filter ideas based on selected platforms
    const filteredIdeas = ideas.filter(
      (idea) => calendarData.platforms[idea.platform.toLowerCase() as keyof typeof calendarData.platforms]
    );

    if (filteredIdeas.length === 0) return; // Skip if no ideas for this week

    // Create table data with dynamic headers based on the actual dates
    const { tableData, headers } = createDetailedWeekTableData(filteredIdeas, weekStart);

    // Add table
    const tableOptions: UserOptions = {
      startY: yOffset,
      head: [['Platform', ...headers]],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
      columnStyles: { 0: { cellWidth: 30 } },
    };

    autoTable(doc, tableOptions);

    // Update yOffset for next week
    yOffset = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : yOffset;

    // Add page break if necessary
    if (index < Object.keys(groupedIdeas).length - 1 && yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
  });

  // Save the PDF
  doc.save('social_media_calendar.pdf');
};

// Group content ideas by week based on their actual dates
const groupContentIdeasByWeek = (contentIdeas: ContentIdea[]) => {
  const groupedIdeas: { [weekStartDate: string]: ContentIdea[] } = {};

  contentIdeas.forEach(idea => {
    const ideaDate = new Date(idea.date);
    const weekStartDate = new Date(ideaDate.getFullYear(), ideaDate.getMonth(), ideaDate.getDate() - ideaDate.getDay());
    const weekStartDateString = weekStartDate.toISOString().split('T')[0];

    if (!groupedIdeas[weekStartDateString]) {
      groupedIdeas[weekStartDateString] = [];
    }
    groupedIdeas[weekStartDateString].push(idea);
  });

  return groupedIdeas;
};

// Create detailed table data and headers based on actual dates
const createDetailedWeekTableData = (ideas: ContentIdea[], weekStartDate: Date) => {
  const platforms = ['instagram', 'facebook', 'twitter', 'linkedin'];
  const headers: string[] = [];
  const tableData: string[][] = [];

  // Create headers for the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    headers.push(`${dayName} ${dateString}`);
  }

  // Create rows for each platform, with data for each day of the week
  platforms.forEach((platform) => {
    const row = [capitalizeFirstLetter(platform)];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
      const ideaForDay = ideas.find((idea) => {
        const ideaDate = new Date(idea.date);
        return idea.platform.toLowerCase() === platform.toLowerCase() && 
               ideaDate.getDate() === currentDate.getDate() &&
               ideaDate.getMonth() === currentDate.getMonth() &&
               ideaDate.getFullYear() === currentDate.getFullYear();
      });

      if (ideaForDay) {
        row.push(
          `Content Type: ${ideaForDay.contentType}\n` +
          `Summary: ${ideaForDay.summary}\n` +
          `Question: ${ideaForDay.question || 'N/A'}\n` +
          `Content Idea: ${ideaForDay.contentIdea || 'N/A'}`
        );
      } else {
        row.push('');
      }
    }

    // Only add the platform row if it has content for at least one day
    if (row.slice(1).some((cell) => cell !== '')) {
      tableData.push(row);
    }
  });

  return { tableData, headers };
};

// Utility function to capitalize the first letter
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};