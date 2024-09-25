import { IncomingForm, Fields, Files } from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Disable body parsing by Next.js so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the JSON schema for the structured output
const calendarSchema = `
{
  "type": "object",
  "properties": {
    "contentPillars": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "keyword": { "type": "string" },
          "questions": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["name", "keyword", "questions"]
      }
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
}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Parse form data using formidable
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

      // Validate that none of the fields are missing
      if (!description || !platforms || !startDate || !endDate || isNaN(frequency)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse platforms (assumes platforms is JSON-encoded)
      const parsedPlatforms = JSON.parse(platforms);

      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

      const getFrequencyLabel = (freq: number) => {
        if (freq === 1) return 'Daily';
        if (freq === 7) return 'Weekly';
        if (freq === 14) return 'Bi-weekly';
        if (freq === 30) return 'Monthly';
        return `Every ${freq} days`;
      };

      const prompt = `
        Generate a social media content calendar based on the following information:
        Business description: ${description}
        Target platforms: ${Object.keys(parsedPlatforms).filter(p => parsedPlatforms[p]).join(', ')}
        Date range: ${startDate} to ${endDate}
        Total days: ${daysDifference}
        Posting frequency: ${getFrequencyLabel(frequency)}

        Please provide the following in your response:
        1. 5 content pillars relevant to the business
        2. For each pillar, provide one relevant keyword
        3. For each keyword, provide 3 frequently asked questions by the target audience
        4. Generate content ideas for each platform based on the posting frequency. The number of content ideas should be appropriate for the given frequency and date range.

        Ensure your response strictly adheres to the following JSON schema:
        ${calendarSchema}

        Your response should be a valid JSON object matching this schema exactly.
      `;

      const logFilePath = path.join(process.cwd(), 'chatgpt_logs.txt');
      console.log('Attempting to write log file to:', logFilePath);

      try {
        await fs.appendFile(logFilePath, `Prompt sent to ChatGPT:\n${prompt}\n\n`);
        console.log('Successfully wrote prompt to log file');
      } catch (writeError) {
        console.error('Error writing prompt to log file:', writeError);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert social media manager with 15+ years of experience in professional social media management. Generate content based on the user's input, strictly adhering to the provided JSON schema." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const generatedContent = JSON.parse(response.choices[0].message.content!);

      try {
        await fs.appendFile(logFilePath, `Response from ChatGPT:\n${JSON.stringify(generatedContent, null, 2)}\n\n`);
        console.log('Successfully wrote response to log file');
      } catch (writeError) {
        console.error('Error writing response to log file:', writeError);
      }
      
      return res.status(200).json(generatedContent);
    } catch (error) {
      console.error('Error generating content:', error);
      return res.status(500).json({ error: 'Failed to generate content' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}