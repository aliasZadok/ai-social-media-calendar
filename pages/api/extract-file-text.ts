import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import PDFParser from 'pdf2json';
import { IncomingForm, Fields, Files, File } from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';

// Disable Next.js body parsing to allow formidable to handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

interface PDFParserError {
  parserError: Error;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
        const form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });

      // Handle the case where the file may be an array or a single file
      const file = Array.isArray(data.files.file) ? data.files.file[0] : data.files.file;
      if (!file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File received:', file.originalFilename, 'Size:', file.size, 'bytes');

      let fileContent: string;

      if (file.mimetype === 'application/pdf') {
        fileContent = await processPDFFile(file);
      } else if (file.mimetype === 'text/plain') {
        fileContent = await fs.readFile(file.filepath, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or TXT file.' });
      }

      if (fileContent.trim().length === 0) {
        console.log('Parsed text is empty');
        return res.status(400).json({ error: 'No text content found in the file' });
      }

      console.log('Sending response with text content');
      return res.status(200).json({ text: fileContent });
    } catch (error) {
      console.error('Error processing file:', error);
      return res.status(500).json({ error: 'Error processing file' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function processPDFFile(file: File): Promise<string> {
  const fileName = uuidv4();
  const tempFilePath = `/tmp/${fileName}.pdf`;

  // Move the uploaded file to a temporary location
  await fs.copyFile(file.filepath, tempFilePath);

  // PDFParser constructor expects a boolean, not 1
  const pdfParser = new PDFParser(null, true);

  const pdfText = await new Promise<string>((resolve, reject) => {
    pdfParser.on('pdfParser_dataError', (errData: PDFParserError) => reject(errData.parserError));
    pdfParser.on('pdfParser_dataReady', () => resolve(pdfParser.getRawTextContent()));

    pdfParser.loadPDF(tempFilePath);
  });

  // Delete the temp file after processing
  await fs.unlink(tempFilePath);

  return pdfText;
}
