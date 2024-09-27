import { IncomingForm, Fields, Files } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ContentIdea {
  date: string;
  platform: string;
  pillar: string;
  contentType: string;
  summary: string;
  question: string;
  contentIdea: string;
}

interface GeneratedContent {
  contentPillars: string[];
  contentIdeas: ContentIdea[];
}

interface ChunkResult {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });

      const description = Array.isArray(data.fields.description) ? data.fields.description[0] : data.fields.description;
      const platforms = Array.isArray(data.fields.platforms) ? data.fields.platforms[0] : data.fields.platforms;
      const startDate = Array.isArray(data.fields.startDate) ? data.fields.startDate[0] : data.fields.startDate;
      const endDate = Array.isArray(data.fields.endDate) ? data.fields.endDate[0] : data.fields.endDate;
      const frequency = Array.isArray(data.fields.frequency) ? parseInt(data.fields.frequency[0]) : parseInt(data.fields.frequency || '0');

      // Fix for the TypeScript error
      const distributionPatternRaw = Array.isArray(data.fields.distributionPattern) 
        ? data.fields.distributionPattern[0] 
        : data.fields.distributionPattern;
      const distributionPattern = distributionPatternRaw 
        ? JSON.parse(distributionPatternRaw as string) 
        : ['Monday', 'Wednesday', 'Friday']; // Default value if undefined

      if (!description || !platforms || !startDate || !endDate || isNaN(frequency)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const parsedPlatforms = JSON.parse(platforms as string);

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Generate dates for content ideas based on the new frequency and distribution pattern
      const contentDates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.toLocaleString('en-US', { weekday: 'long' });
        if (distributionPattern.includes(dayOfWeek)) {
          contentDates.push(new Date(d));
        }
      }

      const getFrequencyLabel = (freq: number) => {
        if (freq === 1) return 'Once a week';
        if (freq === 2) return 'Twice a week';
        if (freq === 3) return 'Three times a week';
        if (freq === 5) return 'Five times a week';
        if (freq === 7) return 'Daily';
        return `${freq} times a week`;
      };

      const generatePrompt = (dates: Date[]) => `
        Generate a social media content calendar based on the following information:
        Business description: ${description}
        Target platforms: ${Object.keys(parsedPlatforms).filter(p => parsedPlatforms[p]).join(', ')}
        Date range: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length - 1].toISOString().split('T')[0]}
        Total days: ${dates.length}
        Posting frequency: ${getFrequencyLabel(frequency)} on ${distributionPattern.join(', ')}
        Number of content ideas needed: ${dates.length}

        Please provide the following in your response:
        1. 5 content pillars relevant to the business
        2. Provide one frequently asked question by the target audience
        3. Generate exactly ${dates.length} content ideas, one for each of these dates: ${dates.map(d => d.toISOString().split('T')[0]).join(', ')}

        Ensure your response strictly adheres to the following JSON schema:
        {
          "type": "object",
          "properties": {
            "contentPillars": {
              "type": "array",
              "items": { "type": "string" }
            },
            "contentIdeas": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "date": { "type": "string" },
                  "platform": { "type": "string" },
                  "pillar": { "type": "string" },
                  "contentType": { "type": "string" },
                  "summary": { "type": "string" },
                  "question": { "type": "string" },
                  "contentIdea": { "type": "string" }
                },
                "required": ["date", "platform", "pillar", "contentType", "summary", "question", "contentIdea"]
              }
            }
          },
          "required": ["contentPillars", "contentIdeas"]
        }

        Your response should be a valid JSON object matching this schema exactly.
      `;

      const logFilePath = path.join(process.cwd(), 'chatgpt_logs.txt');
      console.log('Attempting to write log file to:', logFilePath);

      const generateContent = async (dates: Date[]): Promise<ChunkResult> => {
        const prompt = generatePrompt(dates);

        try {
          await fs.appendFile(logFilePath, `Prompt sent to ChatGPT:\n${prompt}\n\n`);
          console.log('Successfully wrote prompt to log file');
        } catch (writeError) {
          console.error('Error writing prompt to log file:', writeError);
        }

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are an expert social media manager with 15+ years of experience in professional social media management. Generate content based on the user's input, strictly adhering to the provided JSON schema." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
          });

          const generatedContent = JSON.parse(response.choices[0].message.content!) as GeneratedContent;
          await fs.appendFile(logFilePath, `Response from ChatGPT:\n${JSON.stringify(generatedContent, null, 2)}\n\n`);
          console.log('Successfully wrote response to log file');
          return { success: true, content: generatedContent };
        } catch (error) {
          console.error('Error generating or parsing content:', error);
          await fs.appendFile(logFilePath, `Error generating or parsing content:\n${error}\n\n`);
          return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      };

      let initialChunkSize = 30; // Start with 30 days
      const maxChunkSize = 60; // Maximum chunk size to try
      const minChunkSize = 7; // Minimum chunk size to try
      const allContent: GeneratedContent = { contentPillars: [], contentIdeas: [] };

      for (let i = 0; i < contentDates.length;) {
        let currentChunkSize = initialChunkSize;
        let chunkResult: ChunkResult;

        do {
          const chunk = contentDates.slice(i, i + currentChunkSize);
          chunkResult = await generateContent(chunk);

          if (!chunkResult.success) {
            currentChunkSize = Math.max(Math.floor(currentChunkSize / 2), minChunkSize);
          }
        } while (!chunkResult.success && currentChunkSize >= minChunkSize);

        if (chunkResult.success && chunkResult.content) {
          if (allContent.contentPillars.length === 0) {
            allContent.contentPillars = chunkResult.content.contentPillars;
          }
          allContent.contentIdeas = [...allContent.contentIdeas, ...chunkResult.content.contentIdeas];
          i += currentChunkSize;

          // If successful, try a slightly larger chunk next time
          initialChunkSize = Math.min(currentChunkSize + 5, maxChunkSize);
        } else {
          // If we couldn't generate content even for the minimum chunk size, we need to stop
          console.error('Failed to generate content even for minimum chunk size');
          return res.status(500).json({ error: 'Failed to generate content' });
        }
      }

      // Sort content ideas by date
      allContent.contentIdeas.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return res.status(200).json(allContent);
    } catch (error) {
      console.error('Error in request handling:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}